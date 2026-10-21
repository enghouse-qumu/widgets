import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { createElement } from 'preact';
import { PLAYER_REMOVAL_DELAY, PlaylistApi, PlaylistComponent, getAspectRatio, isLiveEnded, isLiveRunning } from '../playlist';
import { Presentation } from '@/interfaces/presentation';
import { PlaylistWidgetConfiguration } from '@/interfaces/playlist-widget';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { PlaylistConfigurationService } from '@/services/playlist-configuration.service';
import { PROGRESS_STORAGE_KEY, ProgressService } from '@/services/progress.service';

interface FakeController {
  answers: Record<string, unknown>;
  commands: Array<[string, unknown[]]>;
  iframe: HTMLIFrameElement;
  isDestroyed: boolean;

  emit(name: string, value?: unknown): void;
}

interface PlayerProps {
  hidden?: boolean;
  playerParameters: Partial<PlayerParameters>;
  presentation: Presentation;
  widgetOptions: {
    playbackMode: string;

    onIframeLoad(iframe: HTMLIFrameElement): void;
  };
}

const controllers = vi.hoisted(() => [] as FakeController[]);
const players = vi.hoisted(() => [] as PlayerProps[]);
// the answers of the next players, merged with the defaults
const answerOverrides = vi.hoisted(() => ({}) as Record<string, unknown>);

vi.mock('@/i18n', () => ({
  useI18n: vi.fn().mockReturnValue({
    getLocale: () => 'en',
    t: vi.fn((key: string) => key),
  }),
}));

vi.mock('../player', async () => {
  const { createElement: h } = await import('preact');

  return {
    PlayerComponent: (props: PlayerProps) => {
      if (!players.includes(props)) {
        players.push(props);
      }

      return h('div', {
        'data-guid': props.presentation.guid,
        'data-mode': props.widgetOptions.playbackMode,
        'data-testid': 'player',
      });
    },
  };
});

vi.mock('@/services/player-controller', () => {
  class Controller implements FakeController {
    answers: Record<string, unknown> = {
      getAudienceReactions: [],
      getAudioTracks: [],
      getCaptionTracks: [],
      getCurrentAudioTrack: null,
      getCurrentCaptionTrack: null,
      getDuration: 20000,
      getLevels: [],
      getLiveState: null,
      getPlaybackRate: 1,
      getPlaybackRates: [0.5, 1, 1.5, 2],
      getVolume: 100,
      isPaused: false,
      ...answerOverrides,
    };

    commands: Array<[string, unknown[]]> = [];
    isDestroyed = false;
    private readonly listeners = new Map<string, Array<(value: unknown) => void>>();
    readonly sdk = new Proxy({}, {
      get: (_, name: string) => (...args: unknown[]) => {
        if (name in this.answers) {
          return Promise.resolve(this.answers[name]);
        }

        this.commands.push([name, args]);

        return undefined;
      },
    });

    constructor(readonly iframe: HTMLIFrameElement) {
      controllers.push(this);
    }

    on(name: string, callback: (value: unknown) => void) {
      this.listeners.set(name, [...(this.listeners.get(name) ?? []), callback]);
    }

    emit(name: string, value?: unknown) {
      if (!this.isDestroyed) {
        this.listeners.get(name)?.forEach((callback) => callback(value));
      }
    }

    request<T>(call: (sdk: unknown) => Promise<T>) {
      return call(this.sdk);
    }

    command(call: (sdk: unknown) => void) {
      if (!this.isDestroyed) {
        call(this.sdk);
      }
    }

    destroy() {
      this.isDestroyed = true;
    }
  }

  return { PlayerController: Controller };
});

describe('PlaylistComponent', () => {
  const presentations: Presentation[] = ['a', 'b', 'c'].map((guid) => ({
    duration: 20000,
    guid,
    player: `https://example.com/player/${guid}`,
    title: guid.toUpperCase(),
  }));

  const configurationService = new PlaylistConfigurationService();

  let apiRef: { current: PlaylistApi | null };

  const renderPlaylist = (
    widgetOptions: PlaylistWidgetConfiguration['widgetOptions'] = {},
    playerParameters: Partial<PlayerParameters> = {},
    items = presentations,
  ) => {
    const configuration = configurationService.createConfiguration({
      playerParameters,
      selector: '#playlist',
      source: {
        host: 'example.com',
        presentationGuids: items.map(({ guid }) => guid!),
      },
      widgetOptions,
    });

    return render(createElement(PlaylistComponent, {
      apiRef,
      configuration,
      presentations: items,
      progressService: new ProgressService(configuration.widgetOptions.trackProgress),
    }));
  };

  const currentPlayer = () => players.at(-1)!;
  const currentController = () => controllers.at(-1)!;
  const rows = () => screen.getAllByRole('listitem');
  const rowButton = (index: number) => rows()[index].querySelector('button')!;

  // the player of the current item loads and answers
  const attachPlayer = async () => {
    await act(() => {
      currentPlayer().widgetOptions.onIframeLoad(document.createElement('iframe'));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /playlist\.(Play|Pause)/ })).toBeEnabled());
  };

  beforeEach(() => {
    apiRef = { current: null };
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    controllers.length = 0;
    players.length = 0;
    Object.keys(answerOverrides).forEach((key) => delete answerOverrides[key]);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('first item', () => {
    it('should show the packshot of the first item with the "inline" playback mode', () => {
      const { container } = renderPlaylist();

      expect(container.querySelector('.qc-thumbnail')).not.toBeNull();
      expect(screen.queryByTestId('player')).toBeNull();
      expect(rowButton(0)).toHaveAttribute('aria-current', 'true');
      // the play button loads the player, the other player controls wait for it
      expect(screen.getByRole('button', { name: 'playlist.Play' })).toBeEnabled();
      expect(screen.getByRole('slider', { name: 'playlist.Seek' })).toBeDisabled();
    });

    it('should load and play the first item from the packshot', () => {
      const { container } = renderPlaylist();

      fireEvent.click(container.querySelector('.qc-thumbnail')!);

      expect(screen.getByTestId('player')).toHaveAttribute('data-mode', 'inline-autoplay');
      expect(currentPlayer().playerParameters.showControlPanel).toBe(false);
    });

    it.each([
      ['inline-autoload', 'inline-autoload'],
      ['inline-autoplay', 'inline-autoplay'],
    ] as const)('should load the first item with the "%s" playback mode', (playbackMode, mode) => {
      renderPlaylist({ playbackMode });

      expect(screen.getByTestId('player')).toHaveAttribute('data-mode', mode);
    });

    it('should start from the first unwatched item and notify it', () => {
      const onItemChange = vi.fn();

      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ a: 100 }));
      renderPlaylist({
        onItemChange,
        playbackMode: 'inline-autoload',
      });

      expect(screen.getByTestId('player')).toHaveAttribute('data-guid', 'b');
      expect(onItemChange).toHaveBeenCalledWith(presentations[1], 1);
      expect(rowButton(1)).toHaveAttribute('aria-current', 'true');
    });

    it('should start from the first item without progress tracking', () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ a: 100 }));
      renderPlaylist({
        playbackMode: 'inline-autoload',
        trackProgress: false,
      });

      expect(screen.getByTestId('player')).toHaveAttribute('data-guid', 'a');
    });

    it('should apply `start` to the first item only', () => {
      renderPlaylist({ playbackMode: 'inline-autoload' }, { start: 30 });

      expect(currentPlayer().playerParameters.start).toBe(30);

      fireEvent.click(rowButton(1));

      expect(currentPlayer().playerParameters.start).toBeUndefined();
    });
  });

  describe('selection', () => {
    it('should load and play the clicked item', () => {
      const onItemChange = vi.fn();

      renderPlaylist({ onItemChange });
      fireEvent.click(rowButton(2));

      expect(screen.getByTestId('player')).toHaveAttribute('data-guid', 'c');
      expect(screen.getByTestId('player')).toHaveAttribute('data-mode', 'inline-autoplay');
      expect(onItemChange).toHaveBeenLastCalledWith(presentations[2], 2);
      expect(rowButton(2)).toHaveAttribute('aria-current', 'true');
      expect(rowButton(0)).not.toHaveAttribute('aria-current');
    });

    it('should toggle the playback when the current item is clicked', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      fireEvent.click(rowButton(0));

      expect(currentController().commands).toContainEqual(['pause', []]);
    });

    it('should destroy the previous player and remove it after a delay', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      const previousController = currentController();

      vi.useFakeTimers();
      fireEvent.click(rowButton(1));

      expect(previousController.isDestroyed).toBe(true);
      expect(screen.getAllByTestId('player')).toHaveLength(2);

      await act(() => {
        vi.advanceTimersByTime(PLAYER_REMOVAL_DELAY);
      });

      expect(screen.getAllByTestId('player')).toHaveLength(1);
      expect(screen.getByTestId('player')).toHaveAttribute('data-guid', 'b');
    });

    it('should select an item through the API, by index or GUID', async () => {
      renderPlaylist();

      await act(() => apiRef.current!.select('c'));

      expect(apiRef.current!.currentIndex).toBe(2);
      expect(screen.getByTestId('player')).toHaveAttribute('data-mode', 'inline-autoplay');

      await act(() => apiRef.current!.select(1, false));

      expect(apiRef.current!.currentIndex).toBe(1);
      expect(screen.getAllByTestId('player').at(-1)).toHaveAttribute('data-mode', 'inline-autoload');

      await act(() => apiRef.current!.select('unknown'));

      expect(apiRef.current!.currentIndex).toBe(1);
      expect(console.warn).toHaveBeenCalledWith('The presentation `unknown` is not in the playlist');
    });

    it('should expose the SDK of the current player', async () => {
      renderPlaylist({ playbackMode: 'inline-autoload' });

      expect(apiRef.current!.playerSdk).toBeUndefined();

      await attachPlayer();

      expect(apiRef.current!.playerSdk).toBe((currentController() as unknown as { sdk: unknown }).sdk);
    });
  });

  describe('previous and next', () => {
    it('should go to the adjacent items and announce them', () => {
      renderPlaylist();

      const previous = screen.getByRole('button', { name: 'playlist.Previous' });
      const next = screen.getByRole('button', { name: 'playlist.Next' });

      expect(previous).toBeDisabled();

      fireEvent.click(next);
      fireEvent.click(next);

      expect(apiRef.current!.currentIndex).toBe(2);
      expect(next).toBeDisabled();
      expect(screen.getByText('playlist.NOW_PLAYING_TITLE')).toBeInTheDocument();

      fireEvent.click(previous);

      expect(apiRef.current!.currentIndex).toBe(1);
    });

    it('should not skip the watched items', async () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ b: 100 }));
      renderPlaylist();

      await act(() => apiRef.current!.next());

      expect(apiRef.current!.currentIndex).toBe(1);
    });

    it('should wrap around with `loop`', async () => {
      renderPlaylist({ loop: true });

      expect(screen.getByRole('button', { name: 'playlist.Previous' })).toBeEnabled();

      await act(() => apiRef.current!.previous());

      expect(apiRef.current!.currentIndex).toBe(2);
    });
  });

  describe('auto-advance', () => {
    it('should play the next item when the current one ends', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(1);
      expect(screen.getAllByTestId('player').at(-1)).toHaveAttribute('data-mode', 'inline-autoplay');
    });

    it('should prefer the next unwatched item with progress tracking', async () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ b: 100 }));
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(2);
      // the ended item is watched
      expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!)).toEqual({
        a: 100,
        b: 100,
      });
    });

    it('should stop at the end of the playlist', async () => {
      const onPlaylistEnd = vi.fn();

      renderPlaylist({
        onPlaylistEnd,
        trackProgress: false,
      });
      await act(() => apiRef.current!.select(2));
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(2);
      expect(onPlaylistEnd).toHaveBeenCalled();
    });

    it('should continue with the first item with `loop`', async () => {
      const onPlaylistEnd = vi.fn();

      renderPlaylist({ loop: true,
        onPlaylistEnd,
        trackProgress: false });
      await act(() => apiRef.current!.select(2));
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(0);
      expect(onPlaylistEnd).not.toHaveBeenCalled();
    });

    it('should not advance when the player loops the item', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' }, { loop: true });
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(0);
    });

    it('should skip an ended live event reached by auto-advance', async () => {
      const items = presentations.map((presentation, index) => ({
        ...presentation,
        vod: index !== 1,
      }));

      renderPlaylist({
        playbackMode: 'inline-autoplay',
        trackProgress: false,
      }, {}, items);
      await attachPlayer();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(1);

      await act(() => {
        currentPlayer().widgetOptions.onIframeLoad(document.createElement('iframe'));
      });
      await act(() => currentController().emit('livestatechange', 'ENDED'));

      expect(apiRef.current!.currentIndex).toBe(2);
    });
    it('should ignore the live state of the VOD items', async () => {
      renderPlaylist({
        playbackMode: 'inline-autoplay',
        trackProgress: false,
      });
      await attachPlayer();

      await act(() => currentController().emit('livestatechange', 'POST_EVENT'));

      expect(screen.queryByText('playlist.Live')).toBeNull();

      await act(() => currentController().emit('ended'));

      expect(apiRef.current!.currentIndex).toBe(1);
    });
  });

  describe('progress', () => {
    it('should resume a partially watched item', () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ a: 50 }));
      renderPlaylist({ playbackMode: 'inline-autoload' });

      expect(currentPlayer().playerParameters.start).toBe(10);
    });

    it('should show the watched time of a partially watched item', () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ b: 40 }));

      renderPlaylist();

      expect(rows()[1].querySelector('[data-field="duration"] dd [aria-hidden]')?.textContent).toBe('00:08 / 00:20');
      expect(rows()[1].textContent).toContain('playlist.In progress');
    });

    it('should save the progress, at most once per second', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      vi.spyOn(Date, 'now').mockReturnValue(10_000);
      await act(() => currentController().emit('timeupdate', 5000));
      await act(() => currentController().emit('timeupdate', 6000));

      expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!)).toEqual({ a: 25 });
    });

    it('should mark the watched items', () => {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ c: 100 }));

      renderPlaylist();

      expect(rows()[2].querySelector('.qc-playlist-item--watched')).not.toBeNull();
      expect(rows()[2].textContent).toContain('playlist.Watched');
    });

    it('should not track the progress when disabled', async () => {
      renderPlaylist({
        playbackMode: 'inline-autoplay',
        trackProgress: false,
      });
      await attachPlayer();

      await act(() => currentController().emit('timeupdate', 5000));

      expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    });
  });

  describe('player', () => {
    it('should enable the controls once the player answers, and follow its events', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });

      expect(screen.getByRole('button', { name: 'playlist.Pause' })).toBeDisabled();

      await attachPlayer();

      expect(screen.getByRole('slider', { name: 'playlist.Seek' })).toBeEnabled();

      await act(() => currentController().emit('pause'));

      expect(screen.getByRole('button', { name: 'playlist.Play' })).toBeInTheDocument();
    });

    it('should only seek on release, and follow the player again after', async () => {
      const { container } = renderPlaylist({ playbackMode: 'inline-autoplay' });

      await attachPlayer();

      const seek = screen.getByRole<HTMLInputElement>('slider', { name: 'playlist.Seek' });
      const time = () => container.querySelector('.qc-playlist-controls__time')?.textContent;
      const seeks = () => currentController().commands.filter(([name]) => name === 'setCurrentTime');

      // dragging: only the displayed time follows the thumb
      await act(() => {
        seek.value = '12000';
        seek.dispatchEvent(new Event('input', { bubbles: true }));
      });

      expect(time()).toBe('00:12');
      expect(seeks()).toEqual([]);

      // releasing, also fired right after `input` by a click on the bar
      await act(() => {
        seek.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(seeks()).toEqual([['setCurrentTime', [12000]]]);

      await act(() => currentController().emit('timeupdate', 13000));

      expect(time()).toBe('00:13');
      expect(seek.value).toBe('13000');
    });

    it('should forward the iframe to `onIframeLoad`', async () => {
      const onIframeLoad = vi.fn();

      renderPlaylist({
        onIframeLoad,
        playbackMode: 'inline-autoload',
      });
      await attachPlayer();

      expect(onIframeLoad).toHaveBeenCalledWith(currentController().iframe);
    });

    it('should carry the viewer choices to the next items', async () => {
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      fireEvent.click(screen.getByRole('button', { name: 'playlist.Mute' }));

      expect(currentController().commands).toContainEqual(['setVolume', [0]]);

      fireEvent.click(screen.getByRole('button', { name: 'playlist.Settings' }));
      fireEvent.click(screen.getByRole('menuitemradio', { name: '1.5×' }));

      expect(currentController().commands).toContainEqual(['setPlaybackRate', [1.5]]);

      await act(() => apiRef.current!.next());

      expect(currentPlayer().playerParameters.volume).toBe(0);

      await attachPlayer();

      // there is no URL parameter for the playback rate
      expect(currentController().commands).toContainEqual(['setPlaybackRate', [1.5]]);
    });

    it('should show the captions and the qualities of the player', async () => {
      answerOverrides.getCaptionTracks = [{
        guid: 'fr',
        languageCode: 'fr',
        source: 'UPLOADED',
        title: '',
      }];
      answerOverrides.getLevels = [{
        key: '720p',
        value: 2,
      }];
      renderPlaylist({ playbackMode: 'inline-autoplay' });
      await attachPlayer();

      fireEvent.click(screen.getByRole('button', { name: 'playlist.Captions' }));
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'French' }));

      expect(currentController().commands).toContainEqual(['enableCaptionTrack', ['fr']]);

      fireEvent.click(screen.getByRole('button', { name: 'playlist.Settings' }));
      fireEvent.click(screen.getByRole('menuitemradio', { name: '720p' }));

      expect(currentController().commands).toContainEqual(['setLevel', [2]]);

      await act(() => apiRef.current!.next());

      expect(currentPlayer().playerParameters).toMatchObject({
        captions: 'fr',
        quality: '720p',
      });
    });

    it('should hide the player, and the controls it needs', async () => {
      answerOverrides.getCaptionTracks = [{
        guid: 'fr',
        languageCode: 'fr',
        source: 'UPLOADED',
        title: 'Français',
      }];
      answerOverrides.getLevels = [{
        key: '720p',
        value: 2,
      }];

      const { container } = renderPlaylist({
        playbackMode: 'inline-autoload',
        showPlayer: false,
      });

      expect(container.querySelector('.qc-playlist__player--hidden')).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.qc-thumbnail')).toBeNull();
      expect(currentPlayer().hidden).toBe(true);
      expect(currentPlayer().playerParameters.quality).toBe('240p');

      await attachPlayer();

      expect(screen.queryByRole('button', { name: 'playlist.Captions' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'playlist.Settings' }));

      // the playback speed only
      const menu = screen.getByRole('menu', { name: 'playlist.Settings' });

      expect(Array.from(menu.querySelectorAll('[role="group"]'), (group) => group.getAttribute('aria-label')))
        .toEqual(['playlist.Playback speed']);
    });

    it('should show the Live badge instead of the timeline for the live items', () => {
      renderPlaylist({}, {}, [{
        ...presentations[0],
        vod: false,
      }]);

      expect(screen.getByText('playlist.Live')).toBeInTheDocument();
      expect(screen.queryByRole('slider', { name: 'playlist.Seek' })).toBeNull();
    });
  });

  describe('helpers', () => {
    it('should read the live states', () => {
      expect(isLiveEnded('ENDED')).toBe(true);
      expect(isLiveEnded('POST_EVENT')).toBe(true);
      expect(isLiveEnded('STARTED')).toBe(false);
      expect(isLiveRunning('STARTED')).toBe(true);
      expect(isLiveRunning('LIVE')).toBe(true);
      expect(isLiveRunning('PRE_EVENT')).toBe(false);
      expect(isLiveRunning('NOT_STARTED')).toBe(false);
      expect(isLiveRunning(null)).toBe(false);
    });

    it('should compute the aspect ratio of the player', () => {
      expect(getAspectRatio({
        mediaDisplayHeight: 3,
        mediaDisplayWidth: 4,
      })).toBe('4 / 3');
      expect(getAspectRatio({
        audioOnly: true,
        mediaDisplayHeight: 3,
        mediaDisplayWidth: 4,
        thumbnail: {
          autoGenerated: false,
          height: 1,
          url: '',
          width: 1,
        },
      })).toBe('1 / 1');
      expect(getAspectRatio({})).toBe('16 / 9');
    });
  });
});
