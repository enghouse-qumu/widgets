import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { createElement } from 'preact';
import { CarouselComponent } from '../carousel';
import { Presentation } from '@/interfaces/presentation';
import { ResolvedCarouselWidgetConfiguration } from '@/services/carousel-configuration.service';

vi.mock('@/i18n', () => ({
  useI18n: vi.fn().mockReturnValue({
    getLocale: () => 'en',
    // the key, followed by the interpolated values
    t: vi.fn((key: string, values?: Record<string, unknown>) => (values ? `${key} ${Object.values(values).join(' ')}` : key)),
  }),
}));

vi.mock('../player', () => ({
  // a click stands for the load of the iframe
  PlayerComponent: ({ presentation, widgetOptions }: { presentation: Presentation;
    widgetOptions: { playbackMode: string;
      onIframeLoad?(iframe: unknown): void; }; }) => createElement('div', {
    'data-mode': widgetOptions.playbackMode,
    'data-testid': 'player-component',
    onClick: () => widgetOptions.onIframeLoad?.('iframe'),
  }, presentation.title),
}));

type WidgetOptions = ResolvedCarouselWidgetConfiguration['widgetOptions'];

describe('CarouselComponent', () => {
  const presentations: Presentation[] = ['a', 'b', 'c', 'd', 'e'].map((guid) => ({
    guid,
    player: `https://example.com/player/${guid}`,
    title: guid.toUpperCase(),
  }));

  const widgetOptions: WidgetOptions = {
    item: {
      info: { bottom: [{ field: 'title' }] },
      showDurationOverlay: false,
    },
    navigation: {
      arrows: true,
      dots: true,
    },
    playbackMode: 'modal',
    style: {},
  };

  // the layout measured by the carousel: the width of the track, and the min item width and gap of the probe
  const layout = {
    gap: 16,
    minItemWidth: 240,
    width: 752,
  };

  let resizeObserverCallback: (() => void) | null;

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
  });

  beforeEach(() => {
    layout.width = 752;
    resizeObserverCallback = null;

    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function clientWidth(this: HTMLElement) {
      return this.classList.contains('qc-carousel__track') || this.classList.contains('qc-carousel__viewport') ? layout.width : 0;
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect(this: Element) {
      const widths: Record<string, number> = {
        'qc-carousel__probe-gap': layout.gap,
        'qc-carousel__probe-item': layout.minItemWidth,
      };

      return { height: 0,
        top: 0,
        width: widths[this.className] ?? 0 } as DOMRect;
    });
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        resizeObserverCallback = callback;
      }

      observe() {}

      disconnect() {}
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderCarousel = (options: Partial<WidgetOptions> = {}, items = presentations) => render(createElement(CarouselComponent, {
    playerParameters: {},
    presentations: items,
    widgetOptions: {
      ...widgetOptions,
      ...options,
    },
  }));

  const pages = (container: Element) => Array.from(container.querySelectorAll<HTMLElement>('.qc-carousel__page'));
  const titles = (page: Element) => Array.from(page.querySelectorAll('.qc-list-item'), (item) => item.querySelector('dd')?.textContent);
  const currentPage = (container: Element) => pages(container).findIndex((page) => !page.hasAttribute('inert'));

  // the init of a touch pointer event at the horizontal position
  const pointer = (clientX: number, pointerType = 'touch') => ({
    clientX,
    isPrimary: true,
    pointerId: 1,
    pointerType,
  });

  const swipe = (viewport: Element, distance: number, pointerType = 'touch') => {
    fireEvent.pointerDown(viewport, pointer(500, pointerType));
    fireEvent.pointerMove(viewport, pointer(500 + distance, pointerType));
    fireEvent.pointerUp(viewport, pointer(500 + distance, pointerType));
  };

  describe('accessibility', () => {
    it('should render a carousel region', () => {
      renderCarousel();

      const region = screen.getByRole('region');

      expect(region).toHaveAttribute('aria-roledescription', 'carousel');
      expect(region).toHaveAttribute('aria-label', 'carousel.Carousel');
    });

    it('should render the pages as labelled slides, the off-page ones inert', () => {
      const { container } = renderCarousel();

      expect(pages(container).map((page) => [
        page.getAttribute('role'),
        page.getAttribute('aria-roledescription'),
        page.getAttribute('aria-label'),
        page.hasAttribute('inert'),
      ])).toEqual([
        ['group', 'slide', 'carousel.SLIDE 1 2', false],
        ['group', 'slide', 'carousel.SLIDE 2 2', true],
      ]);
    });

    it('should label the arrows and the dots', () => {
      renderCarousel();

      expect(screen.getByRole('button', { name: 'carousel.Previous' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'carousel.Next' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'carousel.PAGE 1' })).toHaveAttribute('aria-current', 'true');
      expect(screen.getByRole('button', { name: 'carousel.PAGE 2' })).not.toHaveAttribute('aria-current');
    });

    it('should announce the page changes', () => {
      const { container } = renderCarousel();
      const liveRegion = container.querySelector('[aria-live="polite"]')!;

      expect(liveRegion.textContent).toBe('');

      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      expect(liveRegion.textContent).toBe('carousel.SLIDE 2 2');
    });

    it('should move the focus to the other arrow when the pressed one gets disabled', () => {
      renderCarousel();

      const next = screen.getByRole('button', { name: 'carousel.Next' });

      next.focus();
      fireEvent.click(next);

      expect(next).toBeDisabled();
      expect(screen.getByRole('button', { name: 'carousel.Previous' })).toHaveFocus();
    });
  });

  describe('modal layout', () => {
    it('should show as many items per page as fit', () => {
      const { container } = renderCarousel();

      expect(pages(container).map(titles)).toEqual([
        ['A', 'B', 'C'],
        ['D', 'E'],
      ]);
      expect(container.querySelector<HTMLElement>('.qc-carousel__items')!.style.getPropertyValue('--_qc-cw-per-page')).toBe('3');
    });

    it('should cap the items per page with the columns', () => {
      const { container } = renderCarousel({ style: { columns: 2 } });

      expect(pages(container).map(titles)).toEqual([
        ['A', 'B'],
        ['C', 'D'],
        ['E'],
      ]);
    });

    it('should keep the middle item visible on resize, without sliding', async () => {
      layout.width = 240;

      const { container } = renderCarousel();

      // one item per page, on the page of "D"
      fireEvent.click(screen.getByRole('button', { name: 'carousel.PAGE 4' }));

      layout.width = 496;
      await act(() => resizeObserverCallback!());

      expect(pages(container).map(titles)).toEqual([
        ['A', 'B'],
        ['C', 'D'],
        ['E'],
      ]);
      expect(currentPage(container)).toBe(1);
      expect(container.querySelector('.qc-carousel__track')).toHaveClass('qc-carousel__track--instant');
    });

    it('should open the player in a modal on click', () => {
      const { container } = renderCarousel();

      fireEvent.click(screen.getByText('B'));

      expect(container.querySelector('.qc-dialog dialog')).not.toBeNull();
      expect(screen.getByTestId('player-component')).toHaveAttribute('data-mode', 'modal');
    });

    it('should call onItemClick instead of opening the modal', () => {
      const onItemClick = vi.fn();
      const { container } = renderCarousel({ onItemClick });

      fireEvent.click(screen.getByText('B'));

      expect(onItemClick).toHaveBeenCalledWith(presentations[1]);
      expect(container.querySelector('dialog')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('should change the page with the arrows, without wrapping around', () => {
      const { container } = renderCarousel();
      const next = screen.getByRole('button', { name: 'carousel.Next' });
      const track = container.querySelector<HTMLElement>('.qc-carousel__track')!;

      fireEvent.click(next);

      expect(currentPage(container)).toBe(1);
      expect(next).toBeDisabled();
      expect(track.style.transform).toBe('translateX(calc(-1 * (100% + var(--_qc-cw-page-gap)) + 0px))');
      expect(track).not.toHaveClass('qc-carousel__track--instant');

      fireEvent.click(screen.getByRole('button', { name: 'carousel.Previous' }));

      expect(currentPage(container)).toBe(0);
    });

    it('should change the page with the dots', () => {
      const { container } = renderCarousel({ style: { columns: 1 } });

      fireEvent.click(screen.getByRole('button', { name: 'carousel.PAGE 3' }));

      expect(currentPage(container)).toBe(2);
      expect(screen.getByRole('button', { name: 'carousel.PAGE 3' })).toHaveAttribute('aria-current', 'true');
    });

    it('should hide the arrows and the dots with a single page', () => {
      const { container } = renderCarousel({}, presentations.slice(0, 2));

      expect(pages(container)).toHaveLength(1);
      expect(container.querySelector('.qc-carousel__arrow')).toBeNull();
      expect(container.querySelector('.qc-carousel__dots')).toBeNull();
    });

    it('should hide the arrows and the dots when disabled', () => {
      const { container } = renderCarousel({
        navigation: {
          arrows: false,
          dots: false,
        },
      });

      expect(container.querySelector('.qc-carousel__arrow')).toBeNull();
      expect(container.querySelector('.qc-carousel__dots')).toBeNull();
    });

    it('should use the custom arrow icons', () => {
      const { container } = renderCarousel({
        nextIconUrl: 'https://example.com/next.svg',
        previousIconUrl: 'https://example.com/previous.svg',
      });

      const icons = Array.from(container.querySelectorAll('.qc-carousel__arrow'), (arrow) => [
        arrow.classList.contains('qc-carousel__arrow--custom'),
        arrow.querySelector('img')?.getAttribute('src'),
        arrow.querySelector('img')?.getAttribute('alt'),
        arrow.querySelector('svg'),
      ]);

      expect(icons).toEqual([
        [true, 'https://example.com/previous.svg', '', null],
        [true, 'https://example.com/next.svg', '', null],
      ]);
      // still named for the screen readers
      expect(screen.getByRole('button', { name: 'carousel.Next' })).toBeInTheDocument();
    });

    it('should use the default arrow icons', () => {
      const { container } = renderCarousel();

      expect(container.querySelectorAll('.qc-carousel__arrow svg')).toHaveLength(2);
      expect(container.querySelector('.qc-carousel__arrow--custom')).toBeNull();
    });

    it('should place the arrows and the dots', () => {
      const { container } = renderCarousel({
        style: {
          arrows: { position: 'overlay' },
          dots: { placement: 'top' },
        },
      });

      const carousel = container.querySelector('.qc-carousel')!;

      expect(carousel).toHaveClass('qc-carousel--arrows-overlay');
      expect(carousel.firstElementChild).toHaveClass('qc-carousel__dots', 'qc-carousel__dots--top');
    });

    describe('swipe', () => {
      it('should move the track with the finger', () => {
        const { container } = renderCarousel();
        const viewport = container.querySelector('.qc-carousel__viewport')!;
        const track = container.querySelector<HTMLElement>('.qc-carousel__track')!;

        fireEvent.pointerDown(viewport, pointer(500));
        fireEvent.pointerMove(viewport, pointer(400));

        expect(track.style.transform).toBe('translateX(calc(0 * (100% + var(--_qc-cw-page-gap)) + -100px))');
        expect(track).toHaveClass('qc-carousel__track--instant');

        // resists beyond the first page
        fireEvent.pointerMove(viewport, pointer(560));

        expect(track.style.transform).toBe('translateX(calc(0 * (100% + var(--_qc-cw-page-gap)) + 20px))');
      });

      it('should change the page beyond 20% of the width', () => {
        const { container } = renderCarousel();
        const viewport = container.querySelector('.qc-carousel__viewport')!;

        swipe(viewport, -200);

        expect(currentPage(container)).toBe(1);

        swipe(viewport, 200);

        expect(currentPage(container)).toBe(0);
      });

      it('should go back to the current page after a tiny drag', () => {
        const { container } = renderCarousel();

        swipe(container.querySelector('.qc-carousel__viewport')!, -5);

        expect(currentPage(container)).toBe(0);
        expect(container.querySelector<HTMLElement>('.qc-carousel__track')!.style.transform)
          .toBe('translateX(calc(0 * (100% + var(--_qc-cw-page-gap)) + 0px))');
      });

      it('should go back to the current page when the browser takes over the pointer', () => {
        const { container } = renderCarousel();
        const viewport = container.querySelector('.qc-carousel__viewport')!;

        fireEvent.pointerDown(viewport, pointer(500));
        fireEvent.pointerMove(viewport, pointer(200));
        fireEvent.pointerCancel(viewport, pointer(500));

        expect(currentPage(container)).toBe(0);
      });

      it('should not swipe with the mouse', () => {
        const { container } = renderCarousel();

        swipe(container.querySelector('.qc-carousel__viewport')!, -300, 'mouse');

        expect(currentPage(container)).toBe(0);
      });

      it('should not activate an item at the end of a drag', () => {
        const onItemClick = vi.fn();
        const { container } = renderCarousel({ onItemClick });

        swipe(container.querySelector('.qc-carousel__viewport')!, -200);
        // `detail`: a pointer click
        fireEvent.click(screen.getByText('A'), { detail: 1 });

        expect(onItemClick).not.toHaveBeenCalled();

        // the next click is a click again
        fireEvent.click(screen.getByText('B'), { detail: 1 });

        expect(onItemClick).toHaveBeenCalledWith(presentations[1]);
      });

      it('should activate an item with the keyboard after a swipe without a click', () => {
        const onItemClick = vi.fn();
        const { container } = renderCarousel({ onItemClick });

        // a touch swipe usually ends without a click
        swipe(container.querySelector('.qc-carousel__viewport')!, -200);
        // the keyboard activation of the play button, `detail` 0
        fireEvent.click(screen.getByText('D'), { detail: 0 });

        expect(onItemClick).toHaveBeenCalledWith(presentations[3]);
      });
    });
  });

  describe('right-to-left page', () => {
    beforeEach(() => {
      const { getComputedStyle } = globalThis;

      // jsdom does not inherit the direction of a `dir="rtl"` ancestor
      vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => (element.classList.contains('qc-carousel__viewport')
        ? { direction: 'rtl' } as CSSStyleDeclaration
        : getComputedStyle(element)));
    });


    it('should mark the carousel as right-to-left', () => {
      const { container } = renderCarousel();

      expect(container.querySelector('.qc-carousel')).toHaveClass('qc-carousel--rtl');
    });

    it('should move the track to the right for the next page', () => {
      const { container } = renderCarousel();

      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      expect(container.querySelector<HTMLElement>('.qc-carousel__track')!.style.transform)
        .toBe('translateX(calc(1 * (100% + var(--_qc-cw-page-gap)) + 0px))');
    });

    it('should show the next page when swiping to the right', () => {
      const { container } = renderCarousel();
      const viewport = container.querySelector('.qc-carousel__viewport')!;

      swipe(viewport, 200);

      expect(currentPage(container)).toBe(1);

      swipe(viewport, -200);

      expect(currentPage(container)).toBe(0);
    });

    it('should resist when swiping to the left on the first page', () => {
      const { container } = renderCarousel();
      const viewport = container.querySelector('.qc-carousel__viewport')!;
      const track = container.querySelector<HTMLElement>('.qc-carousel__track')!;

      fireEvent.pointerDown(viewport, pointer(500));
      fireEvent.pointerMove(viewport, pointer(440));

      expect(track.style.transform).toBe('translateX(calc(0 * (100% + var(--_qc-cw-page-gap)) + -20px))');

      fireEvent.pointerMove(viewport, pointer(600));

      expect(track.style.transform).toBe('translateX(calc(0 * (100% + var(--_qc-cw-page-gap)) + 100px))');
    });
  });

  describe('inline layout', () => {
    const players = () => screen.queryAllByTestId('player-component');

    it('should show a single item per page, whatever the width', () => {
      const { container } = renderCarousel({ playbackMode: 'inline' });

      expect(pages(container).map(titles)).toEqual([['A'], ['B'], ['C'], ['D'], ['E']]);
    });

    it('should use the aspect ratio of the presentation for the media', () => {
      const { container } = renderCarousel({ playbackMode: 'inline' }, [
        {
          ...presentations[0],
          mediaDisplayHeight: 3,
          mediaDisplayWidth: 4,
        },
      ]);

      expect(container.querySelector<HTMLElement>('.qc-carousel__item')!.style.getPropertyValue('--_qc-cw-media-aspect-ratio')).toBe('4 / 3');
    });

    it('should play the presentation inline on click', () => {
      renderCarousel({ playbackMode: 'inline' });

      expect(players()).toHaveLength(0);

      fireEvent.click(screen.getByText('A'));

      expect(players()).toHaveLength(1);
      expect(players()[0]).toHaveAttribute('data-mode', 'inline-autoplay');
      expect(players()[0]).toHaveTextContent('A');
      // the info fields are kept
      expect(screen.getByText('A', { selector: 'dd' })).toBeInTheDocument();
    });

    it.each([
      ['inline', false],
      ['inline-autoload', true],
      ['inline-autoplay', true],
    ] as const)('should hide the play button of the packshots in the %s mode: %s', (playbackMode, hidden) => {
      const { container } = renderCarousel({ playbackMode });

      expect(container.querySelector('.qc-carousel')!.classList.contains('qc-carousel--autoload')).toBe(hidden);
    });

    it('should show the thumbnail until the player is loaded', () => {
      const onIframeLoad = vi.fn();
      const { container } = renderCarousel({
        onIframeLoad,
        playbackMode: 'inline-autoload',
      }, [
        {
          ...presentations[0],
          thumbnail: {
            autoGenerated: false,
            height: 90,
            url: 'https://example.com/a.jpg',
            width: 160,
          },
        },
      ]);
      const player = container.querySelector('.qc-carousel__player')!;

      expect(player).not.toHaveClass('qc-carousel__player--loaded');
      expect(player.querySelector('.qc-carousel__player-thumbnail')).toHaveAttribute('src', 'https://example.com/a.jpg');

      fireEvent.click(screen.getByTestId('player-component'));

      expect(player).toHaveClass('qc-carousel__player--loaded');
      expect(onIframeLoad).toHaveBeenCalledWith('iframe');
    });

    it('should show the thumbnail again for the player of the next slide', () => {
      const { container } = renderCarousel({ playbackMode: 'inline-autoplay' });

      fireEvent.click(screen.getByTestId('player-component'));
      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      expect(container.querySelector('.qc-carousel__player')).not.toHaveClass('qc-carousel__player--loaded');
    });

    it('should stop the presentation when the page changes', () => {
      renderCarousel({ playbackMode: 'inline' });

      fireEvent.click(screen.getByText('A'));
      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      // the next slide shows its packshot
      expect(players()).toHaveLength(0);
    });

    it('should call onItemClick instead of playing', () => {
      const onItemClick = vi.fn();

      renderCarousel({
        onItemClick,
        playbackMode: 'inline',
      });

      fireEvent.click(screen.getByText('A'));

      expect(onItemClick).toHaveBeenCalledWith(presentations[0]);
      expect(players()).toHaveLength(0);
    });

    it.each(['inline-autoload', 'inline-autoplay'] as const)('should load the player of the current slide only in the %s mode', (playbackMode) => {
      renderCarousel({ playbackMode });

      expect(players()).toHaveLength(1);
      expect(players()[0]).toHaveAttribute('data-mode', playbackMode);
      expect(players()[0]).toHaveTextContent('A');

      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      expect(players()).toHaveLength(1);
      expect(players()[0]).toHaveTextContent('B');
    });

    it('should keep the player of the previous slide until the slide ends', async () => {
      const { container } = renderCarousel({ playbackMode: 'inline-autoload' });
      const track = container.querySelector<HTMLElement>('.qc-carousel__track')!;

      const { getComputedStyle } = globalThis;

      // the slide transition of the track
      vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => (element === track
        ? { transitionDuration: '0.3s' } as CSSStyleDeclaration
        : getComputedStyle(element)));

      fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

      expect(players()).toHaveLength(1);
      expect(players()[0]).toHaveTextContent('A');

      const transitionEnd = new Event('transitionend');

      Object.assign(transitionEnd, { propertyName: 'transform' });
      await act(() => {
        track.dispatchEvent(transitionEnd);
      });

      expect(players()).toHaveLength(1);
      expect(players()[0]).toHaveTextContent('B');
    });

    it('should load the next player when the slide is interrupted', async () => {
      vi.useFakeTimers();

      try {
        const { container } = renderCarousel({ playbackMode: 'inline-autoload' });
        const track = container.querySelector<HTMLElement>('.qc-carousel__track')!;
        const { getComputedStyle } = globalThis;

        vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => (element === track
          ? { transitionDuration: '0.3s' } as CSSStyleDeclaration
          : getComputedStyle(element)));

        fireEvent.click(screen.getByRole('button', { name: 'carousel.Next' }));

        expect(players()[0]).toHaveTextContent('A');

        await act(() => {
          vi.advanceTimersByTime(400);
        });

        expect(players()).toHaveLength(1);
        expect(players()[0]).toHaveTextContent('B');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
