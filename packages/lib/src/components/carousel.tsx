import { JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Presentation } from '@/interfaces/presentation';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { ResolvedCarouselWidgetConfiguration } from '@/services/carousel-configuration.service';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { getAspectRatio } from '@/utils/presentation-fields';
import {
  computePerPage,
  pageAfterResize,
  pageCount,
  parseTransitionDuration,
  swipeDirection,
  SWIPE_MIN_DISTANCE,
} from '@/utils/carousel';
import { ListItemComponent } from './list-item';
import { ModalPlayerComponent } from './dialog';
import { PlayerComponent } from './player';

// Preact's `useId()` is only unique within a render root, and each widget is its own root: the ids are prefixed
// with a counter, plus a random part in case several copies of the library are loaded in the same page
const idNamespace = `qc-carousel-${Math.random().toString(36).slice(2, 8)}`;
let carouselCount = 0;

interface Props {
  playerParameters: Partial<PlayerParameters>;
  presentations: Presentation[];
  widgetOptions: ResolvedCarouselWidgetConfiguration['widgetOptions'];
}

interface Navigation {
  page: number;
  perPage: number;
  // the page changes without sliding: on the first render and on resize
  instant: boolean;
}

const INSTANT_CLASS = 'qc-carousel__track--instant';

/**
 * The transform of the track showing the page, moved by the drag offset in px.
 * The next pages are on the left on a right-to-left page: the track moves to the right
 */
function trackTransform(page: number, rtl: boolean, offset = 0): string {
  return `translateX(calc(${rtl ? page : -page} * (100% + var(--_qc-cw-page-gap)) + ${offset}px))`;
}

interface PlayerProps {
  playbackMode: ResolvedCarouselWidgetConfiguration['widgetOptions']['playbackMode'];
  playerParameters: Partial<PlayerParameters>;
  presentation: Presentation;
  onIframeLoad?(iframe: HTMLIFrameElement): void;
}

/**
 * The inline player of a slide. The thumbnail stays visible until the player is loaded, rather than the empty iframe
 */
function CarouselPlayerComponent({ playbackMode, playerParameters, presentation, onIframeLoad }: Readonly<PlayerProps>) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div class={loaded ? 'qc-carousel__player qc-carousel__player--loaded' : 'qc-carousel__player'}>
      <img
        class="qc-carousel__player-thumbnail"
        src={presentation.thumbnail?.cdnUrl || presentation.thumbnail?.url}
        alt=""
      />
      <PlayerComponent
        presentation={presentation}
        playerParameters={playerParameters}
        widgetOptions={{
          onIframeLoad: (iframe) => {
            setLoaded(true);
            onIframeLoad?.(iframe);
          },
          // "inline" plays on click, the player is only loaded then
          playbackMode: playbackMode === 'inline' ? 'inline-autoplay' : playbackMode,
        }}
      />
    </div>
  );
}

interface Drag {
  distance: number;
  pointerId: number;
  startTime: number;
  startX: number;
}

export function CarouselComponent({ presentations, playerParameters, widgetOptions }: Readonly<Props>) {
  const i18n = useI18n();
  const { navigation, playbackMode, style } = widgetOptions;
  // several items per page in the modal mode, a single one in the inline modes
  const multiItem = playbackMode === 'modal';
  // the player loads on its own, unless `onItemClick` replaces the playback: the items stay clickable
  const autoload = (playbackMode === 'inline-autoload' || playbackMode === 'inline-autoplay') && !widgetOptions.onItemClick;
  const total = presentations.length;

  const [carouselId] = useState(() => `${idNamespace}-${++carouselCount}`);
  const [nav, setNav] = useState<Navigation>({ instant: true, page: 0, perPage: 1 });
  // a right-to-left page, e.g. `dir="rtl"`: the pages are laid out from the right
  const [rtl, setRtl] = useState(false);
  // the page allowed to have a player: the current page once it has slid in
  const [settledPage, setSettledPage] = useState(0);
  // in the "inline" mode, the page whose packshot was clicked
  const [playingPage, setPlayingPage] = useState<number | null>(null);
  // in the modal mode, the presentation played in the dialog
  const [selected, setSelected] = useState<Presentation | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const bodyRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<Drag | null>(null);
  // the click ending a drag must not activate an item
  const suppressClickRef = useRef(false);
  const pendingFocusRef = useRef<HTMLButtonElement | null>(null);

  const perPage = multiItem ? nav.perPage : 1;
  const pages = pageCount(total, perPage);
  const page = Math.min(nav.page, pages - 1);
  const pageRef = useRef(page);

  pageRef.current = page;

  const slideLabel = (index: number) => i18n.t('carousel.SLIDE', { current: index + 1, total: pages });

  // centres the arrows on the media area of the current page, whatever the info fields above it
  const updateArrowCenter = () => {
    const body = bodyRef.current;
    const media = trackRef.current?.children[pageRef.current]?.querySelector('.qc-thumbnail, .qc-carousel__player');

    if (!body || !media) {
      return;
    }

    const rect = media.getBoundingClientRect();

    if (rect.height > 0) {
      body.style.setProperty('--_qc-cw-arrow-center', `${rect.top - body.getBoundingClientRect().top + rect.height / 2}px`);
    }
  };

  // the items per page follow the width of the track; the arrows are beside it, so it is observed rather than the widget
  useLayoutEffect(() => {
    const viewport = viewportRef.current!;

    const measure = () => {
      // the width of a page, without the padding of the viewport
      const width = trackRef.current!.clientWidth;

      setRtl(getComputedStyle(viewport).direction === 'rtl');

      // not laid out, e.g. hidden
      if (multiItem && width > 0) {
        // the probe resolves `minItemWidth` and `gap`, whatever their CSS unit
        const [minItemWidth, gap] = Array.from(probeRef.current!.children, (child) => child.getBoundingClientRect().width);
        const newPerPage = computePerPage(width, minItemWidth, gap, style.columns, total);

        setNav((prev) => (prev.perPage === newPerPage ? prev : {
          instant: true,
          page: pageAfterResize(prev.page, prev.perPage, newPerPage, total),
          perPage: newPerPage,
        }));
      }

      updateArrowCenter();
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(updateArrowCenter, [page, perPage, settledPage]);

  // the player of the previous page is removed, and the one of the current page loaded, when the slide ends
  useEffect(() => {
    if (page === settledPage) {
      return undefined;
    }

    const track = trackRef.current!;
    const settle = () => {
      setSettledPage(page);
      setPlayingPage((playing) => (playing === page ? playing : null));
    };
    const duration = nav.instant ? 0 : parseTransitionDuration(getComputedStyle(track).transitionDuration);

    // no slide, e.g. with `prefers-reduced-motion`
    if (duration === 0) {
      settle();

      return undefined;
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === track && event.propertyName === 'transform') {
        settle();
      }
    };
    // in case the transition is interrupted
    const timeout = setTimeout(settle, duration + 100);

    track.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      track.removeEventListener('transitionend', handleTransitionEnd);
      clearTimeout(timeout);
    };
  }, [page, settledPage]);

  useEffect(() => {
    pendingFocusRef.current?.focus();
    pendingFocusRef.current = null;
  }, [page]);

  const goTo = (target: number) => {
    const nextPage = Math.max(0, Math.min(target, pages - 1));

    setNav((prev) => ({ ...prev, instant: false, page: nextPage }));

    if (nextPage !== page) {
      setAnnouncement(slideLabel(nextPage));
    }
  };

  const handleArrowClick = (direction: -1 | 1) => {
    const target = page + direction;
    const [pressed, other] = direction < 0 ? [prevRef, nextRef] : [nextRef, prevRef];

    goTo(target);

    // the pressed arrow gets disabled on the first and last pages, the focus moves to the other one once rendered
    if ((target <= 0 || target >= pages - 1) && document.activeElement === pressed.current) {
      pendingFocusRef.current = other.current;
    }
  };

  const handleItemClick = (presentation: Presentation) => {
    if (widgetOptions.onItemClick) {
      widgetOptions.onItemClick(presentation);
    } else if (multiItem) {
      setSelected(presentation);
    } else {
      // plays now, even if the slide is not over
      setSettledPage(page);
      setPlayingPage(page);
    }
  };

  // swipe, on touch and pen input only: the mouse uses the arrows and the dots
  const handlePointerDown = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;

    if (event.pointerType === 'mouse' || !event.isPrimary || pages < 2) {
      return;
    }

    dragRef.current = {
      distance: 0,
      pointerId: event.pointerId,
      startTime: event.timeStamp,
      startX: event.clientX,
    };
  };

  const handlePointerMove = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    drag.distance = event.clientX - drag.startX;

    // keeps the swipe once the finger leaves the viewport. Not on press: a tap would then click the viewport, not the item
    if (Math.abs(drag.distance) >= SWIPE_MIN_DISTANCE && !event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    // resists beyond the first and last pages
    // towards the next pages: to the left, or to the right on a right-to-left page
    const forward = rtl ? drag.distance > 0 : drag.distance < 0;
    const beyond = drag.distance !== 0 && ((page === 0 && !forward) || (page === pages - 1 && forward));
    const track = trackRef.current!;

    // set on the track directly: a render of all the pages on each move would be too slow. The track follows
    // the finger, without sliding
    track.classList.add(INSTANT_CLASS);
    track.style.transform = trackTransform(page, rtl, beyond ? drag.distance / 3 : drag.distance);
  };

  const handlePointerEnd = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    // e.g. the browser scrolls the page vertically: back to the current page
    const cancelled = event.type === 'pointercancel';

    if (!cancelled && Math.abs(drag.distance) >= SWIPE_MIN_DISTANCE) {
      suppressClickRef.current = true;
    }

    // dragging towards the left shows the next page, towards the right on a right-to-left page
    const direction = swipeDirection(drag.distance, event.timeStamp - drag.startTime, event.currentTarget.clientWidth)
      * (rtl ? -1 : 1);
    const target = cancelled
      ? page
      : Math.max(0, Math.min(page + direction, pages - 1));
    const track = trackRef.current!;

    // slides from the dragged position. Set here too, as the render does not update the track when the page stays the same
    track.classList.remove(INSTANT_CLASS);
    track.style.transform = trackTransform(target, rtl);
    goTo(target);
  };

  const handleClickCapture = (event: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    // only a pointer click: a touch swipe usually ends without a click, the flag may still be set when the keyboard
    // activates an item (`detail` 0), which must work. The next pointer press clears it
    if (suppressClickRef.current && event.detail > 0) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const renderPlayer = (presentation: Presentation) => (
    <CarouselPlayerComponent
      key={presentation.guid}
      playbackMode={playbackMode}
      playerParameters={playerParameters}
      presentation={presentation}
      onIframeLoad={widgetOptions.onIframeLoad}
    />
  );

  const renderPage = (index: number) => {
    const items = presentations.slice(index * perPage, (index + 1) * perPage);
    const hasPlayer = index === settledPage && (autoload || (playbackMode === 'inline' && playingPage === index));

    return (
      <div
        key={index}
        class="qc-carousel__page"
        role="group"
        aria-roledescription="slide"
        aria-label={slideLabel(index)}
        inert={index !== page}
      >
        <ul class="qc-carousel__items" role="list" style={{ '--_qc-cw-per-page': perPage }}>
          {items.map((presentation, itemIndex) => (
            <li
              key={presentation.guid ?? itemIndex}
              class="qc-carousel__item"
              style={multiItem ? undefined : { '--_qc-cw-media-aspect-ratio': getAspectRatio(presentation) }}
            >
              <ListItemComponent
                id={`${carouselId}-${presentation.guid ?? index * perPage + itemIndex}`}
                item={widgetOptions.item}
                media={hasPlayer ? renderPlayer(presentation) : undefined}
                metadataStyle={style.item?.metadata}
                playIconUrl={widgetOptions.playIconUrl}
                presentation={presentation}
                onClick={handleItemClick}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const trackId = `${carouselId}-track`;
  const showArrows = navigation.arrows && pages > 1;
  const showDots = navigation.dots && pages > 1;
  const dotsPlacement = style.dots?.placement ?? 'bottom';

  const dots = showDots && (
    <div class={`qc-carousel__dots qc-carousel__dots--${dotsPlacement}`}>
      {Array.from({ length: pages }, (_, index) => (
        <button
          key={index}
          type="button"
          class="qc-carousel__dot"
          aria-controls={trackId}
          aria-current={index === page ? 'true' : undefined}
          aria-label={i18n.t('carousel.PAGE', { page: index + 1 })}
          onClick={() => goTo(index)}
        />
      ))}
    </div>
  );

  const renderArrow = (direction: -1 | 1) => {
    const iconUrl = direction < 0 ? widgetOptions.previousIconUrl : widgetOptions.nextIconUrl;
    const classes = ['qc-carousel__arrow', `qc-carousel__arrow--${direction < 0 ? 'prev' : 'next'}`];

    if (iconUrl) {
      classes.push('qc-carousel__arrow--custom');
    }

    return (
      <button
        ref={direction < 0 ? prevRef : nextRef}
        type="button"
        class={classes.join(' ')}
        aria-controls={trackId}
        aria-label={i18n.t(direction < 0 ? 'carousel.Previous' : 'carousel.Next')}
        disabled={direction < 0 ? page === 0 : page === pages - 1}
        onClick={() => handleArrowClick(direction)}
      >
        {/* like the custom play icon, the image replaces the default button */}
        {iconUrl ? (
          <img class="qc-carousel__arrow-icon" src={iconUrl} alt=""/>
        ) : (
          <Icon name={direction < 0 ? 'chevron-left' : 'chevron-right'}/>
        )}
      </button>
    );
  };

  const carouselClasses = ['qc-carousel', `qc-carousel--arrows-${style.arrows?.position ?? 'outside'}`];

  if (rtl) {
    carouselClasses.push('qc-carousel--rtl');
  }

  // the packshot shown until the player loads has no play button
  if (autoload) {
    carouselClasses.push('qc-carousel--autoload');
  }

  const trackClasses = ['qc-carousel__track'];

  if (nav.instant) {
    trackClasses.push(INSTANT_CLASS);
  }

  return (
    <>
      <section
        class={carouselClasses.join(' ')}
        aria-roledescription="carousel"
        aria-label={i18n.t('carousel.Carousel')}
      >
        {dotsPlacement === 'top' && dots}
        <div ref={bodyRef} class="qc-carousel__body">
          {showArrows && renderArrow(-1)}
          <div
            ref={viewportRef}
            class="qc-carousel__viewport"
            onClickCapture={handleClickCapture}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
          >
            <div ref={probeRef} class="qc-carousel__probe" aria-hidden="true">
              <span class="qc-carousel__probe-item"/>
              <span class="qc-carousel__probe-gap"/>
            </div>
            <div
              ref={trackRef}
              id={trackId}
              class={trackClasses.join(' ')}
              style={{ transform: trackTransform(page, rtl) }}
            >
              {Array.from({ length: pages }, (_, index) => renderPage(index))}
            </div>
          </div>
          {showArrows && renderArrow(1)}
        </div>
        {dotsPlacement !== 'top' && dots}
        <div class="qc-sr-only" aria-live="polite">{announcement}</div>
      </section>

      {selected && (
        <ModalPlayerComponent
          presentation={selected}
          playerParameters={playerParameters}
          onIframeLoad={widgetOptions.onIframeLoad}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
