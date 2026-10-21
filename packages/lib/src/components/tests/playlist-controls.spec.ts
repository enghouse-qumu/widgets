import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { createElement } from 'preact';
import { emptyPlayerState, PlayerState, PlaylistControlsComponent } from '../playlist-controls';
import { defaultControls } from '@/services/playlist-configuration.service';

vi.mock('@/i18n', () => ({
  useI18n: vi.fn().mockReturnValue({
    getLocale: () => 'en',
    t: vi.fn((key: string, options?: Record<string, string>) => (options ? `${key} ${JSON.stringify(options)}` : key)),
  }),
}));

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
    expect(screen.queryByRole('button', { name: 'playlist.Audio track' })).toBeNull();
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

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Audio track' }));

    expect(screen.getByRole('menuitemradio', { name: 'English (playlist.Original)' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'English (playlist.Audio description)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Captions' }));

    expect(screen.getByRole('menuitemradio', { name: 'playlist.Off' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'German (playlist.Auto)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'playlist.Settings' }));

    expect(screen.getByRole('menuitemradio', { name: 'playlist.Normal' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: '2×' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'playlist.Reactions' })).toBeInTheDocument();
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
