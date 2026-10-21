import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PlayerSdk, SdkAudioTrack, SdkCaptionTrack } from '@qumu/player-sdk';
import { Presentation } from '@/interfaces/presentation';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { ResolvedPlaylistWidgetConfiguration } from '@/services/playlist-configuration.service';
import { PlayerController } from '@/services/player-controller';
import { ProgressService } from '@/services/progress.service';
import { useI18n } from '@/i18n';
import { decodeEntities } from '@/utils/presentation-fields';
import { PlayerComponent } from './player';
import { ThumbnailComponent } from './thumbnail';
import { emptyPlayerState, PlayerState, PlaylistControlsComponent } from './playlist-controls';
import { PlaylistItemComponent, PlaylistItemStatus } from './playlist-item';

// the old player is kept for a short time after its SDK is destroyed, so the player receives the message
// and flushes its view statistics
export const PLAYER_REMOVAL_DELAY = 200;
// the progress is saved at most once per second
const PROGRESS_SAVE_INTERVAL = 1000;
// the `quality` values of the player URL, the other levels are only selected through the SDK
const urlQualities = new Set<string>(['240p', '480p', '720p', '1080p', '1440p', 'auto', 'best']);

// Preact's `useId()` is only unique within a render root, and each widget is its own root: the ids are prefixed
// with a counter, plus a random part in case several copies of the library are loaded in the same page
const idNamespace = `qc-playlist-${Math.random().toString(36).slice(2, 8)}`;
let playlistCount = 0;

export interface PlaylistApi {
  readonly currentIndex: number;
  readonly playerSdk: PlayerSdk | undefined;

  next(): void;

  previous(): void;

  select(indexOrGuid: number | string, play?: boolean): void;
}

interface Props {
  // set by the component, used by the PlaylistWidget instance API
  apiRef: { current: PlaylistApi | null };
  configuration: ResolvedPlaylistWidgetConfiguration;
  presentations: Presentation[];
  progressService: ProgressService;
}

// a player of an item: every item change mounts a new iframe and a new SDK
interface Session {
  autoplay: boolean;
  // reached by auto-advance: an already ended live event is skipped
  autoAdvanced: boolean;
  id: number;
  parameters: Partial<PlayerParameters>;
  presentation: Presentation;
  // replaced by a new item, removed after PLAYER_REMOVAL_DELAY
  retiring: boolean;
}

// the viewer's choices, carried to the following items
interface Choices {
  audio?: string;
  // `null`: the captions were turned off
  captions?: string | null;
  quality?: string;
  rate?: number;
  volume?: number;
}

interface LoadOptions {
  announce?: boolean;
  autoAdvanced?: boolean;
  autoplay: boolean;
}

// The live states are not documented by the SDK, they are matched loosely, e.g. PRE_EVENT, STARTED, POST_EVENT.
// They only apply to the live items: the player also reports PRE_EVENT for a VOD presentation
export function isLiveEnded(state: string | null | undefined): boolean {
  return !!state && /^post|end|stop|finish|complete/i.test(state);
}

export function isLiveRunning(state: string | null | undefined): boolean {
  return !!state && !isLiveEnded(state) && !/^pre|not.?started|schedul|pending|wait|upcoming/i.test(state);
}

/**
 * The aspect ratio of the player: the media, the thumbnail for the audio-only presentations, or 16 / 9
 */
export function getAspectRatio(presentation: Presentation | undefined): string {
  if (presentation?.mediaDisplayWidth && presentation.mediaDisplayHeight && !presentation.audioOnly) {
    return `${presentation.mediaDisplayWidth} / ${presentation.mediaDisplayHeight}`;
  }

  if (presentation?.thumbnail?.width && presentation.thumbnail.height) {
    return `${presentation.thumbnail.width} / ${presentation.thumbnail.height}`;
  }

  return '16 / 9';
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function PlaylistComponent({ apiRef, configuration, presentations, progressService }: Readonly<Props>) {
  const i18n = useI18n();
  const { playerParameters, widgetOptions } = configuration;
  const { controls, item, loop, playbackMode, playIconUrl, showPlayer, style } = widgetOptions;
  // without storage, the widget behaves as without progress tracking
  const trackProgress = widgetOptions.trackProgress && progressService.available;
  const count = presentations.length;

  const [listId] = useState(() => `${idNamespace}-${++playlistCount}`);
  const [progress, setProgress] = useState<Record<string, number | undefined>>(() => Object.fromEntries(
    presentations.map(({ guid }) => [guid ?? '', progressService.get(guid)]),
  ));
  // the first unwatched item with progress tracking, otherwise the first item
  const startIndex = useMemo(() => (trackProgress
    ? Math.max(0, presentations.findIndex(({ guid }) => progress[guid ?? ''] !== 100))
    : 0), []);
  const [index, setIndex] = useState(startIndex);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [player, setPlayer] = useState<PlayerState>(() => ({
    ...emptyPlayerState,
    duration: presentations[startIndex]?.duration ?? 0,
    live: presentations[startIndex]?.vod === false,
  }));
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // the latest values, read by the player events and the instance API between the renders
  const indexRef = useRef(startIndex);
  const progressRef = useRef(progress);
  const playerRef = useRef(player);
  const sessionRef = useRef<Session | null>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const choicesRef = useRef<Choices>({});
  const lastVolumeRef = useRef(100);
  const lastProgressSaveRef = useRef(0);
  const endedLiveRef = useRef(new Set<string>());
  const refreshedSessionRef = useRef(0);
  const sessionIdRef = useRef(0);
  const firstLoadRef = useRef(true);
  const removalTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const areaRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  playerRef.current = player;

  const current = presentations[index];
  const loaded = sessions.some(({ retiring }) => !retiring);

  const updatePlayer = (update: Partial<PlayerState> | ((state: PlayerState) => Partial<PlayerState>)) => {
    setPlayer((state) => {
      const next = { ...state, ...(typeof update === 'function' ? update(state) : update) };

      playerRef.current = next;

      return next;
    });
  };

  const saveProgress = (guid: string | undefined, percent: number) => {
    if (!guid) {
      return;
    }

    progressService.set(guid, percent);
    progressRef.current = { ...progressRef.current, [guid]: progressService.get(guid) };
    setProgress(progressRef.current);
  };

  // the start time of an item, in seconds, from its stored progress
  const getResumeTime = (presentation: Presentation): number | undefined => {
    const percent = progressRef.current[presentation.guid ?? ''];

    if (!trackProgress || presentation.vod === false || !presentation.duration || !percent || percent >= 100) {
      return undefined;
    }

    return Math.floor((presentation.duration * percent) / 100 / 1000) || undefined;
  };

  const buildParameters = (presentation: Presentation): Partial<PlayerParameters> => {
    const { start, ...initialParameters } = playerParameters;
    const parameters: Partial<PlayerParameters> = { ...initialParameters, showControlPanel: false };
    const choices = choicesRef.current;

    if ('captions' in choices) {
      if (choices.captions) {
        parameters.captions = choices.captions;
      } else {
        delete parameters.captions;
      }
    }

    if (choices.audio) {
      parameters.audio = choices.audio;
    }

    if (choices.volume !== undefined) {
      parameters.volume = choices.volume;
    }

    if (choices.quality && urlQualities.has(choices.quality)) {
      parameters.quality = choices.quality as PlayerParameters['quality'];
    }

    // `start` only applies to the first item, the progress resumes the others
    const resumeTime = getResumeTime(presentation);

    if (resumeTime) {
      parameters.start = resumeTime;
    } else if (firstLoadRef.current && start !== undefined) {
      parameters.start = start;
    }

    return parameters;
  };

  const changeIndex = (newIndex: number, announce: boolean) => {
    const presentation = presentations[newIndex];

    if (announce) {
      setAnnouncement(i18n.t('playlist.NOW_PLAYING_TITLE', { title: decodeEntities(presentation.title ?? '') }));
    }

    if (newIndex === indexRef.current) {
      return;
    }

    indexRef.current = newIndex;
    setIndex(newIndex);
    widgetOptions.onItemChange?.(presentation, newIndex);
  };

  /**
   * Loads an item in a new player, the previous player is destroyed
   */
  const load = (newIndex: number, { announce = false, autoAdvanced = false, autoplay }: LoadOptions) => {
    const presentation = presentations[newIndex];
    const choices = choicesRef.current;

    controllerRef.current?.destroy();
    controllerRef.current = null;

    const session: Session = {
      autoAdvanced,
      autoplay,
      id: ++sessionIdRef.current,
      parameters: buildParameters(presentation),
      presentation,
      retiring: false,
    };

    firstLoadRef.current = false;
    sessionRef.current = session;
    setSessions((previous) => [
      ...previous.map((previousSession) => (previousSession.retiring ? previousSession : { ...previousSession, retiring: true })),
      session,
    ]);
    updatePlayer({
      ...emptyPlayerState,
      duration: presentation.duration ?? 0,
      level: choices.quality ?? 'auto',
      live: presentation.vod === false,
      paused: !autoplay,
      playbackRate: choices.rate ?? 1,
      volume: choices.volume ?? playerRef.current.volume,
    });
    changeIndex(newIndex, announce);
  };

  const findAdjacent = (delta: number): number => {
    const target = indexRef.current + delta;

    if (target >= 0 && target < count) {
      return target;
    }

    return loop && count > 1 ? (target + count) % count : -1;
  };

  // the next item of the auto-advance: the next unwatched one with progress tracking, the ended live events skipped
  const findAutoNext = (): number => {
    const from = indexRef.current;
    const steps = loop ? count : count - 1 - from;
    const candidates = Array.from({ length: Math.max(steps, 0) }, (_, step) => (from + step + 1) % count)
      .filter((candidate) => !endedLiveRef.current.has(presentations[candidate].guid ?? ''));

    if (trackProgress) {
      const unwatched = candidates.find((candidate) => progressRef.current[presentations[candidate].guid ?? ''] !== 100);

      if (unwatched !== undefined) {
        return unwatched;
      }
    }

    return candidates[0] ?? -1;
  };

  const advance = () => {
    const next = findAutoNext();

    if (next === -1) {
      widgetOptions.onPlaylistEnd?.();

      return;
    }

    load(next, {
      announce: true,
      autoAdvanced: true,
      autoplay: true,
    });
  };

  const handleEnded = () => {
    // the player loops the item itself
    if (playerParameters.loop) {
      return;
    }

    updatePlayer({ paused: true });

    if (trackProgress && !playerRef.current.live) {
      saveProgress(presentations[indexRef.current].guid, 100);
    }

    advance();
  };

  const handleTimeUpdate = (time: number) => {
    updatePlayer({
      currentTime: time,
      ready: true,
    });

    const presentation = presentations[indexRef.current];
    const guid = presentation.guid ?? '';
    const duration = playerRef.current.duration || presentation.duration;
    const now = Date.now();

    // live items are never resumed, and a watched item stays watched
    if (!trackProgress || playerRef.current.live || !duration || !time || progressRef.current[guid] === 100
      || now - lastProgressSaveRef.current < PROGRESS_SAVE_INTERVAL) {
      return;
    }

    lastProgressSaveRef.current = now;
    saveProgress(guid, (time / duration) * 100);
  };

  const handleLiveState = (controller: PlayerController, state: string | null) => {
    const session = sessionRef.current;

    // the live state of a VOD presentation is meaningless
    if (session?.presentation.vod !== false) {
      return;
    }

    const running = isLiveRunning(state);

    updatePlayer({ liveRunning: running });

    if (running && controls.audienceReactions) {
      controller.request((sdk) => sdk.getAudienceReactions())
        .then((reactions) => updatePlayer({ reactions: reactions ?? [] }))
        .catch(() => undefined);
    }

    if (isLiveEnded(state) && session) {
      endedLiveRef.current.add(session.presentation.guid ?? '');

      // an ended live event is skipped by the auto-advance, but stays when the viewer selected it
      if (session.autoAdvanced) {
        session.autoAdvanced = false;
        advance();
      }
    }
  };

  /**
   * Reads the state of the player: once the player answered, then after the first play, when the media is ready
   */
  const refreshDetails = async (controller: PlayerController, applyChoices: boolean) => {
    const get = <T, >(call: (sdk: PlayerSdk) => Promise<T>) => controller.request(call).catch(() => undefined);
    const [duration, volume, captionTracks, captionTrack, audioTracks, audioTrack, levels, playbackRates, playbackRate, liveState] = await Promise.all([
      get((sdk) => sdk.getDuration()),
      get((sdk) => sdk.getVolume()),
      get((sdk) => sdk.getCaptionTracks()),
      get((sdk) => sdk.getCurrentCaptionTrack()),
      get((sdk) => sdk.getAudioTracks()),
      get((sdk) => sdk.getCurrentAudioTrack()),
      get((sdk) => sdk.getLevels()),
      get((sdk) => sdk.getPlaybackRates()),
      get((sdk) => sdk.getPlaybackRate()),
      get((sdk) => sdk.getLiveState()),
    ]);

    if (controller.isDestroyed) {
      return;
    }

    updatePlayer((state) => ({
      audioTrack: audioTrack === undefined ? state.audioTrack : (audioTrack as SdkAudioTrack | null)?.code ?? null,
      audioTracks: audioTracks ?? state.audioTracks,
      captionTrack: captionTrack === undefined ? state.captionTrack : (captionTrack as SdkCaptionTrack | null)?.languageCode ?? null,
      captionTracks: captionTracks ?? state.captionTracks,
      duration: duration || state.duration,
      levels: levels ?? state.levels,
      playbackRate: playbackRate ?? state.playbackRate,
      playbackRates: playbackRates ?? state.playbackRates,
      volume: volume ?? state.volume,
    }));

    if (liveState !== undefined) {
      handleLiveState(controller, liveState);
    }

    if (!applyChoices) {
      return;
    }

    // there is no URL parameter for the playback rate, and the levels of the SDK are not all URL qualities
    const choices = choicesRef.current;

    if (choices.rate !== undefined && playbackRates) {
      const rate = playbackRates.includes(choices.rate) ? choices.rate : 1;

      if (rate !== playbackRate) {
        controller.command((sdk) => sdk.setPlaybackRate(rate));
        updatePlayer({ playbackRate: rate });
      }
    }

    if (choices.quality !== undefined && levels) {
      const level = levels.find(({ key }) => key === choices.quality);

      controller.command((sdk) => sdk.setLevel(level?.value ?? -1));
      updatePlayer({ level: level?.key ?? 'auto' });
    }

    if (choices.captions === null && captionTrack) {
      controller.command((sdk) => sdk.disableCaptionTrack());
      updatePlayer({ captionTrack: null });
    }
  };

  const attach = (session: Session, iframe: HTMLIFrameElement) => {
    // an iframe of a previous item, or a reload of the iframe
    if (sessionRef.current?.id !== session.id || controllerRef.current) {
      return;
    }

    const controller = new PlayerController(iframe);
    const refreshAfterPlay = () => {
      if (refreshedSessionRef.current !== session.id) {
        refreshedSessionRef.current = session.id;
        void refreshDetails(controller, false);
      }
    };

    controllerRef.current = controller;

    // the events are read through `actionsRef`, the handlers of the latest render
    controller.on('play', () => {
      updatePlayer({
        paused: false,
        ready: true,
      });
      refreshAfterPlay();
    });
    controller.on('pause', () => updatePlayer({ paused: true }));
    controller.on<number>('timeupdate', (time) => {
      actionsRef.current.handleTimeUpdate(time);
      refreshAfterPlay();
    });
    controller.on('ended', () => actionsRef.current.handleEnded());
    controller.on<number>('volumechange', (volume) => updatePlayer({ volume }));
    controller.on<SdkCaptionTrack | null>('captiontrackchange', (track) => updatePlayer({ captionTrack: track?.languageCode ?? null }));
    controller.on<SdkAudioTrack | null>('audiotrackchange', (track) => updatePlayer({ audioTrack: track?.code ?? null }));
    controller.on<number>('playbackratechange', (playbackRate) => updatePlayer({ playbackRate }));
    controller.on<string | null>('livestatechange', (state) => actionsRef.current.handleLiveState(controller, state));

    // the SDK `ready` is the handshake: the controls are enabled once the player actually answers
    controller.request((sdk) => sdk.isPaused())
      .then((paused) => {
        updatePlayer({
          paused,
          ready: true,
        });

        return actionsRef.current.refreshDetails(controller, true);
      })
      .catch((err: unknown) => console.warn(err));

    widgetOptions.onIframeLoad?.(iframe);
  };

  const select = (indexOrGuid: number | string, play = true) => {
    const newIndex = typeof indexOrGuid === 'number'
      ? indexOrGuid
      : presentations.findIndex(({ guid }) => guid === indexOrGuid);

    if (!Number.isInteger(newIndex) || newIndex < 0 || newIndex >= count) {
      console.warn(`The presentation \`${indexOrGuid}\` is not in the playlist`);

      return;
    }

    if (newIndex === indexRef.current && controllerRef.current) {
      if (play) {
        controllerRef.current.command((sdk) => sdk.play());
      }

      return;
    }

    load(newIndex, { autoplay: play });
  };

  const goTo = (delta: number) => {
    const target = findAdjacent(delta);

    if (target !== -1) {
      load(target, {
        announce: true,
        autoplay: true,
      });
    }
  };

  const togglePlay = () => {
    const controller = controllerRef.current;

    if (!sessionRef.current) {
      load(indexRef.current, { autoplay: true });
    } else if (playerRef.current.paused) {
      controller?.command((sdk) => sdk.play());
    } else {
      controller?.command((sdk) => sdk.pause());
    }
  };

  const setVolume = (volume: number) => {
    choicesRef.current.volume = volume;

    if (volume > 0) {
      lastVolumeRef.current = volume;
    }

    controllerRef.current?.command((sdk) => sdk.setVolume(volume));
    updatePlayer({ volume });
  };

  const actions = {
    attach,
    handleEnded,
    handleLiveState,
    handleTimeUpdate,
    refreshDetails,
    select,
    togglePlay,
    goTo,
  };
  const actionsRef = useRef(actions);

  actionsRef.current = actions;

  // the row click toggles the playback of the current item, and plays the others
  const handleRowClick = useCallback((rowIndex: number) => {
    if (rowIndex === indexRef.current && controllerRef.current) {
      actionsRef.current.togglePlay();
    } else {
      actionsRef.current.select(rowIndex, true);
    }
  }, []);

  apiRef.current = {
    get currentIndex() {
      return indexRef.current;
    },
    get playerSdk() {
      return controllerRef.current?.sdk;
    },
    next: () => actionsRef.current.goTo(1),
    previous: () => actionsRef.current.goTo(-1),
    select: (indexOrGuid, play) => actionsRef.current.select(indexOrGuid, play),
  };

  // a layout effect: run while the widget renders, so the first item is set when `PlaylistWidget.create()` resolves
  useLayoutEffect(() => {
    // the first item starts according to the playback mode, the packshot is shown with "inline"
    if (playbackMode !== 'inline') {
      load(startIndex, { autoplay: playbackMode === 'inline-autoplay' });
    }

    widgetOptions.onItemChange?.(presentations[startIndex], startIndex);

    const handleFullscreenChange = () => setFullscreen(!!areaRef.current && document.fullscreenElement === areaRef.current);

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (areaRef.current && document.fullscreenElement === areaRef.current) {
        document.exitFullscreen().catch(() => undefined);
      }

      controllerRef.current?.destroy();
      controllerRef.current = null;
      removalTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // the replaced players are removed once their SDK had the time to tell them they are destroyed
  useEffect(() => {
    sessions.filter(({ id, retiring }) => retiring && !removalTimersRef.current.has(id)).forEach(({ id }) => {
      removalTimersRef.current.set(id, setTimeout(() => {
        removalTimersRef.current.delete(id);
        setSessions((previous) => previous.filter((session) => session.id !== id));
      }, PLAYER_REMOVAL_DELAY));
    });
  }, [sessions]);

  // the current item is scrolled into view inside the list only, the page never scrolls
  useEffect(() => {
    const list = listRef.current;
    const row = list?.children.item(index) as HTMLElement | null;

    if (!list || !row || list.scrollHeight <= list.clientHeight) {
      return;
    }

    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    let top: number | undefined;

    if (rowTop < list.scrollTop) {
      top = rowTop;
    } else if (rowBottom > list.scrollTop + list.clientHeight) {
      top = rowBottom - list.clientHeight;
    }

    if (top !== undefined) {
      list.scrollTo?.({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        top,
      });
    }
  }, [index]);

  const toggleFullscreen = () => {
    const area = areaRef.current;

    if (!area) {
      return;
    }

    if (document.fullscreenElement === area) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      area.requestFullscreen().catch((err: unknown) => console.warn(err));
    }
  };

  const getRowStatus = (rowIndex: number, presentation: Presentation): PlaylistItemStatus => {
    if (rowIndex === index && loaded && !player.paused) {
      return 'playing';
    }

    return trackProgress && progress[presentation.guid ?? ''] === 100 ? 'watched' : 'idle';
  };

  // the watched time of a partially watched item, live for the current item
  const getWatchedTime = (rowIndex: number, presentation: Presentation): number | undefined => {
    if (!trackProgress || !presentation.duration || presentation.vod === false) {
      return undefined;
    }

    if (rowIndex === index && loaded && player.currentTime > 0 && !player.live) {
      return player.currentTime;
    }

    const percent = progress[presentation.guid ?? ''];

    return percent && percent < 100 ? (presentation.duration * percent) / 100 : undefined;
  };

  const playerClasses = ['qc-playlist__player'];

  if (!showPlayer) {
    playerClasses.push('qc-playlist__player--hidden');
  }

  // the clicks would disappear into the iframe, and not close the menu
  if (menuOpen) {
    playerClasses.push('qc-playlist__player--menu-open');
  }

  return (
    <>
      <div ref={areaRef} class="qc-playlist__player-area">
        <div
          class={playerClasses.join(' ')}
          style={{ '--_qc-plw-item-aspect-ratio': getAspectRatio(current) }}
          aria-hidden={showPlayer ? undefined : 'true'}
        >
          {!sessions.length && showPlayer && current && (
            <ThumbnailComponent
              presentation={current}
              widgetOptions={{ playIconUrl }}
              onClick={() => load(indexRef.current, { autoplay: true })}
            />
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              class={session.retiring ? 'qc-playlist__frame qc-playlist__frame--retiring' : 'qc-playlist__frame'}
              inert={session.retiring}
            >
              <PlayerComponent
                hidden={!showPlayer || session.retiring}
                presentation={session.presentation}
                playerParameters={session.parameters}
                widgetOptions={{
                  onIframeLoad: (iframe) => actionsRef.current.attach(session, iframe),
                  playbackMode: session.autoplay ? 'inline-autoplay' : 'inline-autoload',
                }}
              />
            </div>
          ))}
        </div>
        <PlaylistControlsComponent
          controls={controls}
          fullscreen={fullscreen}
          hasNext={findAdjacent(1) !== -1}
          hasPrevious={findAdjacent(-1) !== -1}
          showPlayer={showPlayer}
          packshot={!loaded}
          state={player}
          onAudioTrack={(code) => {
            choicesRef.current.audio = code;
            controllerRef.current?.command((sdk) => sdk.setAudioTrack(code));
            updatePlayer({ audioTrack: code });
          }}
          onCaptionTrack={(languageCode) => {
            choicesRef.current.captions = languageCode;
            controllerRef.current?.command((sdk) => (languageCode ? sdk.enableCaptionTrack(languageCode) : sdk.disableCaptionTrack()));
            updatePlayer({ captionTrack: languageCode });
          }}
          onFullscreen={toggleFullscreen}
          onMenuOpenChange={setMenuOpen}
          onMute={() => setVolume(player.volume > 0 ? 0 : lastVolumeRef.current || 100)}
          onNext={() => goTo(1)}
          onPlayPause={togglePlay}
          onPlaybackRate={(rate) => {
            choicesRef.current.rate = rate;
            controllerRef.current?.command((sdk) => sdk.setPlaybackRate(rate));
            updatePlayer({ playbackRate: rate });
          }}
          onPrevious={() => goTo(-1)}
          onQuality={(key) => {
            const level = player.levels.find((candidate) => candidate.key === key);

            choicesRef.current.quality = key;
            controllerRef.current?.command((sdk) => sdk.setLevel(level?.value ?? -1));
            updatePlayer({ level: level?.key ?? 'auto' });
          }}
          onReaction={(reaction) => controllerRef.current?.command((sdk) => sdk.sendAudienceReaction(reaction))}
          onSeek={(time) => {
            controllerRef.current?.command((sdk) => sdk.setCurrentTime(Math.round(time)));
            updatePlayer({ currentTime: time });
          }}
          onVolume={setVolume}
        />
      </div>
      {/* `role="list"`: Safari drops the list semantics with `list-style: none` */}
      <ul ref={listRef} class="qc-playlist__list" role="list">
        {presentations.map((presentation, rowIndex) => {
          const key = presentation.guid ?? String(rowIndex);

          return (
            <li class="qc-playlist__item" key={key}>
              <PlaylistItemComponent
                active={rowIndex === index}
                id={`${listId}-${key}`}
                index={rowIndex}
                item={item}
                metadataStyle={style.item?.metadata}
                presentation={presentation}
                status={getRowStatus(rowIndex, presentation)}
                watchedTime={getWatchedTime(rowIndex, presentation)}
                onClick={handleRowClick}
              />
            </li>
          );
        })}
      </ul>
      <div class="qc-sr-only" aria-live="polite">{announcement}</div>
    </>
  );
}
