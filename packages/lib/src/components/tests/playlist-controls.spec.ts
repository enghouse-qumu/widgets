import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { createElement } from 'preact';
import { emptyPlayerState, PlayerState, PlaylistControlsComponent } from '../playlist-controls';
import { defaultControls } from '@/services/playlist-configuration.service';

// the keys, but the language names of the English translations
vi.mock('@/i18n', async () => {
  const { default: en } = await import('@/locales/en.json');
  const { languages }: { languages: Record<string, string> } = en.playlist;

  return {
    useI18n: vi.fn().mockReturnValue({
      getLocale: () => 'en',
      t: vi.fn((key: string, options?: Record<string, string>) => {
        if (key.startsWith('playlist.languages.')) {
          return languages[key.slice('playlist.languages.'.length)] ?? key;
        }

        return options ? `${key} ${JSON.stringify(options)}` : key;
      }),
    }),
  };
});

describe('PlaylistControlsComponent', () => {
  const readyState: PlayerState = {
    ...emptyPlayerState,
    currentTime: 8000,
    duration: 20000,
    paused: false,
    ready: true,
    volume: 80,
  };
  const handlers = {
    onFullscreen: vi.fn(),
    onMute: vi.fn(),
    onNext: vi.fn(),
    onPlayPause: vi.fn(),
    onPrevious: vi.fn(),
    onSeek: vi.fn(),
    onVolume: vi.fn(),
  };

  type Props = Parameters<typeof PlaylistControlsComponent>[0];

  const renderControls = (props: Partial<Props> = {}) => render(createElement(PlaylistControlsComponent, {
    controls: defaultControls,
    hasNext: true,
    hasPrevious: true,
    state: readyState,
    ...handlers,
    ...props,
  }));

  const seek = () => screen.getByRole('slider', { name: 'playlist.Seek' });
  const volume = () => screen.getByRole('slider', { name: 'playlist.Volume' });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be a labelled group', () => {
    renderControls();

    expect(screen.getByRole('group', { name: 'playlist.Player controls' })).toBeInTheDocument();
  });

  it('should show the times and describe the seek bar', () => {
    const { container } = renderControls();

    expect(Array.from(container.querySelectorAll('.qc-playlist-controls__time'), (time) => time.textContent)).toEqual(['00:08', '00:20']);
    expect(seek()).toHaveAttribute('aria-valuetext', 'playlist.TIME_OF_DURATION {"current":"8 seconds","duration":"20 seconds"}');
  });

  it('should only seek on release while dragging', () => {
    const { container } = renderControls();

    fireEvent.input(seek(), { target: { value: '12000' } });

    expect(container.querySelector('.qc-playlist-controls__time')?.textContent).toBe('00:12');
    expect(handlers.onSeek).not.toHaveBeenCalled();

    fireEvent.change(seek(), { target: { value: '12000' } });

    expect(handlers.onSeek).toHaveBeenCalledWith(12000);
  });

  it('should follow the playback again when released where the drag started', async () => {
    const { container } = renderControls();
    const time = () => container.querySelector('.qc-playlist-controls__time')?.textContent;
    const initialTime = time();

    vi.useFakeTimers();
    fireEvent.input(seek(), { target: { value: '12000' } });

    expect(time()).toBe('00:12');

    // no `change`: the value is the one of the start of the drag
    fireEvent.pointerUp(seek());
    await act(() => vi.runAllTimers());

    expect(time()).toBe(initialTime);
    expect(handlers.onSeek).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it.each([
    ['ArrowRight', 13000],
    ['ArrowLeft', 3000],
    ['PageUp', 10000],
    ['PageDown', 6000],
    ['Home', 0],
    ['End', 20000],
  ])('should seek with the %s key', (key, time) => {
    renderControls();
    fireEvent.keyDown(seek(), { key });

    expect(handlers.onSeek).toHaveBeenCalledWith(time);
  });

  it('should change the volume with the keyboard and describe it', () => {
    renderControls();

    expect(volume()).toHaveAttribute('aria-valuetext', '80%');

    fireEvent.keyDown(volume(), { key: 'ArrowUp' });

    expect(handlers.onVolume).toHaveBeenCalledWith(85);
  });

  it('should switch the play and mute labels', () => {
    const { rerender } = renderControls();

    expect(screen.getByRole('button', { name: 'playlist.Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'playlist.Mute' })).toBeInTheDocument();

    rerender(createElement(PlaylistControlsComponent, {
      controls: defaultControls,
      state: {
        ...readyState,
        paused: true,
        volume: 0,
      },
    }));

    expect(screen.getByRole('button', { name: 'playlist.Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'playlist.Unmute' })).toBeInTheDocument();
  });

  it('should only show the mute toggle on touch devices', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    renderControls();

    expect(screen.queryByRole('slider', { name: 'playlist.Volume' })).toBeNull();
    expect(screen.getByRole('button', { name: 'playlist.Mute' })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('should disable the player controls until the player answers', () => {
    renderControls({
      state: {
        ...readyState,
        ready: false,
      },
    });

    expect(seek()).toBeDisabled();
    expect(volume()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'playlist.Pause' })).toBeDisabled();
    // the viewer can still select another item
    expect(screen.getByRole('button', { name: 'playlist.Next' })).toBeEnabled();
  });

  it('should only enable the play button in the packshot state', () => {
    renderControls({ packshot: true });

    expect(screen.getByRole('button', { name: 'playlist.Play' })).toBeEnabled();
    expect(seek()).toBeDisabled();
  });

  it('should disable previous and next at the ends', () => {
    renderControls({
      hasNext: false,
      hasPrevious: false,
    });

    expect(screen.getByRole('button', { name: 'playlist.Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'playlist.Next' })).toBeDisabled();
  });

  it('should hide the optional controls without anything to offer', () => {
    renderControls();

    expect(screen.queryByRole('button', { name: 'playlist.Captions' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'playlist.Audio languages' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'playlist.Settings' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'playlist.Reactions' })).toBeNull();
  });

  it('should show the menus of the available options', () => {
    renderControls({
      state: {
        ...readyState,
        audioTracks: [
          {
            code: 'en',
            isAudioDescription: false,
            isOriginal: true,
            languageCode: 'en',
          },
          {
            code: 'en-ad',
            isAudioDescription: true,
            isOriginal: false,
            languageCode: 'en',
          },
        ],
        captionTracks: [{
          guid: 'g',
          languageCode: 'de',
          source: 'AUTOGENERATED',
          title: '',
        }],
        live: true,
        liveRunning: true,
        playbackRates: [1, 2],
        reactions: ['👍'],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Audio languages' }));

    expect(screen.getByRole('menuitemradio', { name: 'English playlist.Original' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'English playlist.Audio description' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Captions' }));

    expect(screen.getByRole('menuitemradio', { name: 'playlist.None' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'German playlist.AUTO_CAPTIONS' })).toBeInTheDocument();

    // the settings menu: a submenu per setting, like the player
    fireEvent.click(screen.getByRole('button', { name: 'playlist.Settings' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['playlist.Playback speed']);

    fireEvent.click(screen.getByRole('menuitem', { name: 'playlist.Playback speed' }));

    expect(screen.getByRole('menuitemradio', { name: 'playlist.Normal' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: '2×' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'playlist.Reactions' })).toBeInTheDocument();
  });

  it('should name and sort the tracks like the legacy widget', () => {
    renderControls({
      state: {
        ...readyState,
        audioTracks: [
          {
            code: 'fr',
            isAudioDescription: false,
            isOriginal: false,
            languageCode: 'fr',
          },
          {
            code: 'ja',
            isAudioDescription: false,
            isOriginal: true,
            languageCode: 'ja',
          },
          {
            code: 'de',
            isAudioDescription: false,
            isOriginal: false,
            languageCode: 'de',
          },
        ],
        captionTracks: [
          {
            guid: 'fr',
            languageCode: 'fr',
            source: 'UPLOADED',
            title: 'Français',
          },
          {
            guid: 'xx',
            languageCode: 'xx-unknown',
            source: 'UPLOADED',
            title: 'Klingon',
          },
          {
            guid: 'en',
            languageCode: 'en',
            source: 'AUTOGENERATED',
            title: 'English [auto]',
          },
        ],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Captions' }));

    // "None" first, then by name; the title of the player for an unknown language
    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent))
      .toEqual(['playlist.None', 'English playlist.AUTO_CAPTIONS', 'French', 'Klingon']);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'playlist.Audio languages' }));

    // the original track first, then by name
    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent))
      .toEqual(['Japanese playlist.Original', 'French', 'German']);
  });

  it('should only show the audio languages with several tracks', () => {
    renderControls({
      state: {
        ...readyState,
        audioTracks: [{
          code: 'en',
          isAudioDescription: false,
          isOriginal: true,
          languageCode: 'en',
        }],
      },
    });

    expect(screen.queryByRole('button', { name: 'playlist.Audio languages' })).toBeNull();
  });

  it('should hide the disabled controls', () => {
    renderControls({
      controls: {
        ...defaultControls,
        playbackRate: false,
        volume: false,
      },
      state: {
        ...readyState,
        playbackRates: [1, 2],
      },
    });

    expect(screen.queryByRole('button', { name: 'playlist.Mute' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'playlist.Settings' })).toBeNull();
  });

  it('should show the Live badge instead of the timeline', () => {
    renderControls({
      state: {
        ...readyState,
        live: true,
      },
    });

    expect(screen.getByText('playlist.Live')).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'playlist.Seek' })).toBeNull();
  });

  it('should show the fullscreen button when available', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    });

    const { rerender } = renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Fullscreen' }));

    expect(handlers.onFullscreen).toHaveBeenCalled();

    rerender(createElement(PlaylistControlsComponent, {
      controls: defaultControls,
      fullscreen: true,
      state: readyState,
    }));

    expect(screen.getByRole('button', { name: 'playlist.Exit fullscreen' })).toBeInTheDocument();

    rerender(createElement(PlaylistControlsComponent, {
      controls: defaultControls,
      showPlayer: false,
      state: readyState,
    }));

    expect(screen.queryByRole('button', { name: /fullscreen/i })).toBeNull();

    Reflect.deleteProperty(document, 'fullscreenEnabled');
  });
});
