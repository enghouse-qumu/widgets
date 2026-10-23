import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { PlaylistWidget } from '@/widgets/playlist-widget';
import { PlaylistWidgetConfiguration } from '@/interfaces/playlist-widget';
import { PresentationService } from '@/services/presentation.service';
import { Presentation } from '@/interfaces/presentation';

vi.mock('@/services/presentation.service');
vi.mock('@/services/player-controller');

describe('PlaylistWidget', () => {
  const mockConfiguration: PlaylistWidgetConfiguration = {
    selector: '.widget-container',
    source: {
      host: 'example.com',
      smartSearchGuid: 'smart-search-guid',
    },
  };

  const mockPresentations: Presentation[] = [
    {
      duration: 8000,
      guid: 'a',
      player: 'https://example.com/player/a',
      title: 'Presentation A',
    },
    {
      duration: 20000,
      guid: 'b',
      player: 'https://example.com/player/b',
      title: 'Presentation B',
    },
  ];

  let container: HTMLElement;
  let getPresentationsMock: MockInstance;

  beforeEach(() => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: vi.fn(),
      writable: true,
    });

    container = document.createElement('div');
    container.classList.add('widget-container');
    document.body.appendChild(container);

    getPresentationsMock = vi.spyOn(PresentationService.prototype, 'getPresentations')
      .mockResolvedValue({
        presentations: mockPresentations,
        total: 2,
      });

    localStorage.clear();
    console.error = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    // eslint-disable-next-line no-underscore-dangle
    globalThis.window.__QUMU_WIDGET_TELEMETRY__ = undefined;

    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should validate the configuration', async () => {
    await expect(() => PlaylistWidget.create({
      ...mockConfiguration,
      source: { host: 'example.com' } as PlaylistWidgetConfiguration['source'],
    })).rejects.toThrow('`source` must define exactly one of');
  });

  it('should fetch the presentations with the resolved source', async () => {
    await PlaylistWidget.create(mockConfiguration);

    expect(getPresentationsMock).toHaveBeenCalledWith({
      host: 'example.com',
      limit: 100,
      smartSearchGuid: 'smart-search-guid',
    });
  });

  it('should render the player, the controls and the list in a labelled region', async () => {
    await PlaylistWidget.create({
      ...mockConfiguration,
      selector: container,
    });

    expect(container).toHaveClass('qc-widget', 'qc-playlist-widget');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', 'Playlist');
    expect(container.querySelector('.qc-playlist__player .qc-thumbnail')).not.toBeNull();
    expect(container.querySelector('.qc-playlist-controls')).not.toBeNull();
    expect(container.querySelectorAll('.qc-playlist-item')).toHaveLength(2);
  });

  it('should render the placeholders while loading', async () => {
    type PresentationList = Awaited<ReturnType<PresentationService['getPresentations']>>;
    let resolve: (value: PresentationList) => void = () => undefined;

    getPresentationsMock.mockReturnValueOnce(new Promise((done) => {
      resolve = done;
    }));

    const widget = PlaylistWidget.create(mockConfiguration);

    await Promise.resolve();

    expect(container.querySelector('.qc-playlist__player--skeleton')).not.toBeNull();
    expect(container.querySelector('.qc-playlist-controls--disabled')).not.toBeNull();
    expect(container.querySelectorAll('.qc-list-item--skeleton')).toHaveLength(12);
    expect(container.querySelector('.qc-list-skeleton__thumbnail')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Loading presentations…');

    resolve({
      presentations: mockPresentations,
      total: 2,
    });
    await widget;

    expect(container.querySelector('.qc-list-skeleton')).toBeNull();
  });

  it('should render the empty state when there are no presentations', async () => {
    getPresentationsMock.mockResolvedValueOnce({
      presentations: [],
      total: 0,
    });

    const widget = await PlaylistWidget.create(mockConfiguration);

    expect(container.querySelector('.qc-not-found')?.textContent).toBe('No presentations found');
    expect(container.querySelector('.qc-playlist-controls')).toBeNull();
    expect(widget.currentIndex).toBe(-1);
  });

  it('should render the empty state when the fetch fails', async () => {
    getPresentationsMock.mockRejectedValueOnce(new Error('boom'));

    await PlaylistWidget.create(mockConfiguration);

    expect(console.error).toHaveBeenCalled();
    expect(container.querySelector('.qc-not-found')).not.toBeNull();
  });

  it('should throw when the container is not found', async () => {
    await expect(() => PlaylistWidget.create({
      ...mockConfiguration,
      selector: '.missing',
    })).rejects.toThrow('Element for selector ".missing" not found');
  });

  it('should expose the presentations and the selection', async () => {
    const onItemChange = vi.fn();
    const widget = await PlaylistWidget.create({
      ...mockConfiguration,
      widgetOptions: { onItemChange },
    });

    expect(widget.presentations).toEqual(mockPresentations);
    expect(widget.currentIndex).toBe(0);
    expect(widget.playerSdk).toBeUndefined();
    expect(onItemChange).toHaveBeenCalledWith(mockPresentations[0], 0);

    widget.next();

    expect(widget.currentIndex).toBe(1);

    widget.previous();

    expect(widget.currentIndex).toBe(0);

    widget.select('b', false);

    expect(widget.currentIndex).toBe(1);
    expect(onItemChange).toHaveBeenLastCalledWith(mockPresentations[1], 1);
  });

  it('should set the style as CSS custom properties', async () => {
    await PlaylistWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        style: {
          controls: {
            buttons: { iconSize: '24px' },
            primary: { backgroundColor: 'orange' },
          },
          height: '480px',
          item: {
            activeBackgroundColor: 'red',
            metadata: { title: { color: 'blue' } },
          },
          notFound: { color: 'green' },
          player: {
            aspectRatio: '4:3',
            playButton: { position: 'top-left' },
          },
        },
      },
    });

    expect(container.style.getPropertyValue('--qc-plw-height')).toBe('480px');
    expect(container.style.getPropertyValue('--qc-plw-controls-buttons-icon-size')).toBe('24px');
    expect(container.style.getPropertyValue('--qc-plw-controls-primary-background-color')).toBe('orange');
    expect(container.style.getPropertyValue('--qc-plw-item-active-background-color')).toBe('red');
    expect(container.style.getPropertyValue('--qc-plw-player-aspect-ratio')).toBe('4/3');
    expect(container.style.getPropertyValue('--qc-plw-player-play-button-position')).toBe('start start');
    expect(container.style.getPropertyValue('--qc-pw-not-found-color')).toBe('green');
    // applied on each field
    expect(container.style.getPropertyValue('--qc-plw-item-metadata-title-color')).toBe('');
  });

  it('should restore the container on destroy', async () => {
    container.className = 'host-class';
    container.setAttribute('style', 'color: red;');
    container.setAttribute('role', 'complementary');

    const widget = await PlaylistWidget.create({
      ...mockConfiguration,
      selector: container,
      widgetOptions: { style: { height: '480px' } },
    });

    widget.destroy();
    widget.destroy();

    expect(container.innerHTML).toBe('');
    expect(container.className).toBe('host-class');
    expect(container.getAttribute('style')).toBe('color: red;');
    expect(container.getAttribute('role')).toBe('complementary');
    expect(container.hasAttribute('aria-label')).toBe(false);
    expect(widget.presentations).toEqual([]);
    expect(widget.currentIndex).toBe(-1);
  });

  it('should remove the style attribute the container did not have', async () => {
    const widget = await PlaylistWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        showPlayer: false,
        style: { height: '300px' },
      },
    });

    widget.next();
    widget.destroy();

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    expect(container.hasAttribute('style')).toBe(false);
    expect(container.className).toBe('widget-container');
  });

  it('should send the telemetry', async () => {
    await PlaylistWidget.create({
      ...mockConfiguration,
      widgetOptions: { onPlaylistEnd: vi.fn() },
    });

    expect(navigator.sendBeacon).toHaveBeenCalledWith('https://example.com/telemetry/widgets', expect.any(String));

    const telemetry = JSON.parse((navigator.sendBeacon as unknown as MockInstance).mock.calls[0][1] as string) as {
      type: string;
      widgetOptions: Record<string, unknown>;
    };

    expect(telemetry.type).toBe('playlist');
    expect(telemetry.widgetOptions.onPlaylistEnd).toBe(true);
  });

  it('should not send the telemetry when disabled', async () => {
    // eslint-disable-next-line no-underscore-dangle
    globalThis.window.__QUMU_WIDGET_TELEMETRY__ = false;

    await PlaylistWidget.create(mockConfiguration);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });
});
