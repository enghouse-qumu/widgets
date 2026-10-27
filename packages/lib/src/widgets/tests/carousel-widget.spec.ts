import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { CarouselWidget } from '@/widgets/carousel-widget';
import { CarouselWidgetConfiguration } from '@/interfaces/carousel-widget';
import { PresentationService } from '@/services/presentation.service';
import { Presentation } from '@/interfaces/presentation';

vi.mock('@/services/presentation.service');

describe('CarouselWidget', () => {
  const mockConfiguration: CarouselWidgetConfiguration = {
    selector: '.widget-container',
    source: {
      host: 'example.com',
      smartSearchGuid: 'playlist-guid',
    },
  };

  const mockPresentations: Presentation[] = [
    {
      guid: 'a',
      player: 'https://example.com/player/a',
      title: 'Presentation A',
    },
    {
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

    console.error = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';

    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should validate the configuration', async () => {
    await expect(() => CarouselWidget.create({
      ...mockConfiguration,
      source: { host: 'example.com' } as CarouselWidgetConfiguration['source'],
    })).rejects.toThrow('`source` must define exactly one of');
  });

  it('should fetch the presentations with the resolved source', async () => {
    await CarouselWidget.create(mockConfiguration);

    expect(getPresentationsMock).toHaveBeenCalledWith({
      host: 'example.com',
      limit: 12,
      smartSearchGuid: 'playlist-guid',
    });
  });

  it('should render the carousel in the container', async () => {
    await CarouselWidget.create({
      ...mockConfiguration,
      selector: container,
    });

    expect(container.className).toBe('widget-container qc-widget qc-carousel-widget qc-carousel-widget--multi');
    expect(container.querySelector('.qc-carousel')).toHaveAttribute('aria-roledescription', 'carousel');
    expect(container.querySelectorAll('.qc-carousel__item')).toHaveLength(2);
  });

  it('should render a single item per page in the inline modes', async () => {
    await CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: { playbackMode: 'inline' },
    });

    expect(container).toHaveClass('qc-carousel-widget--single');
    expect(container.querySelectorAll('.qc-carousel__page')).toHaveLength(2);
  });

  it('should render the ghost items while loading', async () => {
    let resolve: (value: { presentations: Presentation[];
      total: number; }) => void = () => {};

    getPresentationsMock.mockReturnValueOnce(new Promise((resolver) => {
      resolve = resolver;
    }));

    const widget = CarouselWidget.create({
      ...mockConfiguration,
      source: {
        ...mockConfiguration.source,
        limit: 4,
      },
    });

    // the ghosts are rendered synchronously, before the presentations are fetched
    expect(container.querySelectorAll('.qc-list-item--skeleton')).toHaveLength(4);

    resolve({
      presentations: mockPresentations,
      total: 2,
    });
    await widget;

    expect(container.querySelector('.qc-list-skeleton')).toBeNull();
  });

  it('should render a single ghost item in the inline modes', () => {
    getPresentationsMock.mockReturnValueOnce(new Promise(() => {}));

    void CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: { playbackMode: 'inline-autoplay' },
    });

    expect(container.querySelectorAll('.qc-list-item--skeleton')).toHaveLength(1);
  });

  it('should render the empty state when there are no presentations', async () => {
    getPresentationsMock.mockResolvedValueOnce({
      presentations: [],
      total: 0,
    });

    await CarouselWidget.create(mockConfiguration);

    expect(container.querySelector('.qc-not-found')?.textContent).toBe('No presentations found');
  });

  it('should render the empty state when the fetch fails', async () => {
    getPresentationsMock.mockRejectedValueOnce(new Error('boom'));

    await CarouselWidget.create(mockConfiguration);

    expect(console.error).toHaveBeenCalled();
    expect(container.querySelector('.qc-not-found')).not.toBeNull();
  });

  it('should throw when the container is not found', async () => {
    await expect(() => CarouselWidget.create({
      ...mockConfiguration,
      selector: '.missing',
    })).rejects.toThrow('Element for selector ".missing" not found');
  });

  it('should set the style as CSS custom properties', async () => {
    await CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        style: {
          arrows: {
            activeBackgroundColor: 'gray',
            activeColor: 'black',
            backgroundColor: 'white',
            height: '44px',
            horizontalGap: '4px',
            padding: '12px',
            position: 'overlay',
            width: '48px',
          },
          borderRadius: '10px',
          closeButton: { color: 'red' },
          columns: 3,
          dots: {
            activeColor: 'blue',
            horizontalGap: '6px',
            placement: 'top',
            selectedColor: 'navy',
            verticalGap: '20px',
          },
          gap: '24px',
          item: {
            durationBadge: {
              position: 'top-left',
              textTransform: 'uppercase',
            },
            metadata: { title: { color: 'blue' } },
            thumbnail: { aspectRatio: '4:3' },
          },
          minItemWidth: '200px',
          transitionDuration: '500ms',
        },
      },
    });

    const style = (name: string) => container.style.getPropertyValue(name);

    expect(style('--qc-lw-gap')).toBe('24px');
    expect(style('--qc-lw-min-item-width')).toBe('200px');
    expect(style('--qc-lw-grid-template-columns'))
      .toBe('repeat(auto-fill, minmax(min(max(var(--qc-lw-min-item-width), (100% - 2 * var(--qc-lw-gap)) / 3), 100%), 1fr))');
    expect(style('--qc-lw-border-radius')).toBe('10px');
    expect(style('--qc-lw-item-duration-badge-position')).toBe('start start');
    expect(style('--qc-lw-item-duration-badge-text-transform')).toBe('uppercase');
    expect(style('--qc-lw-item-thumbnail-aspect-ratio')).toBe('4/3');
    expect(style('--qc-cw-transition-duration')).toBe('500ms');
    expect(style('--qc-cw-arrows-background-color')).toBe('white');
    expect(style('--qc-cw-arrows-width')).toBe('48px');
    expect(style('--qc-cw-arrows-height')).toBe('44px');
    expect(style('--qc-cw-arrows-padding')).toBe('12px');
    expect(style('--qc-cw-arrows-active-background-color')).toBe('gray');
    expect(style('--qc-cw-arrows-active-color')).toBe('black');
    expect(style('--qc-cw-arrows-horizontal-gap')).toBe('4px');
    expect(style('--qc-cw-dots-horizontal-gap')).toBe('6px');
    expect(style('--qc-cw-dots-vertical-gap')).toBe('20px');
    expect(style('--qc-cw-dots-active-color')).toBe('blue');
    expect(style('--qc-cw-dots-selected-color')).toBe('navy');
    // shared with the presentation widget components
    expect(style('--qc-pw-close-button-color')).toBe('red');
    // the arrows position and the dots placement are classes, the metadata styles are applied per field
    expect(style('--qc-cw-arrows-position')).toBe('');
    expect(container.getAttribute('style')).not.toContain('placement');
    expect(container.getAttribute('style')).not.toContain('metadata');
    expect(container.querySelector('.qc-carousel')).toHaveClass('qc-carousel--arrows-overlay');
    expect(container.querySelector<HTMLElement>('[data-field="title"]')!.style.getPropertyValue('--qc-lw-field-color')).toBe('blue');
  });

  it('should send the telemetry', async () => {
    const onItemClick = vi.fn();

    await CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: { onItemClick },
    });

    const [url, body] = vi.mocked(navigator.sendBeacon).mock.calls[0] as [string, string];

    expect(url).toBe('https://example.com/telemetry/widgets');
    expect(JSON.parse(body)).toMatchObject({
      source: {
        host: 'example.com',
        smartSearchGuid: 'playlist-guid',
      },
      type: 'carousel',
      widgetOptions: {
        navigation: {
          arrows: true,
          dots: true,
        },
        onItemClick: true,
        playbackMode: 'modal',
      },
    });
  });

  it('should not send the telemetry when disabled', async () => {
    // eslint-disable-next-line no-underscore-dangle
    globalThis.window.__QUMU_WIDGET_TELEMETRY__ = false;

    await CarouselWidget.create(mockConfiguration);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();

    // eslint-disable-next-line no-underscore-dangle
    delete globalThis.window.__QUMU_WIDGET_TELEMETRY__;
  });

  it('should destroy the widget', async () => {
    const widget = await CarouselWidget.create(mockConfiguration);

    widget.destroy();
    widget.destroy();

    expect(container.innerHTML).toBe('');
  });

  it('should restore the classes and the style of the container on destroy', async () => {
    container.style.setProperty('margin', '8px');

    const widget = await CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        style: {
          columns: 3,
          gap: '24px',
        },
      },
    });

    expect(container.className).toBe('widget-container qc-widget qc-carousel-widget qc-carousel-widget--multi');
    expect(container.style.getPropertyValue('--qc-lw-gap')).toBe('24px');

    widget.destroy();

    expect(container.className).toBe('widget-container');
    expect(container.getAttribute('style')).toBe('margin: 8px;');
  });

  it('should not keep the classes and the style of a destroyed widget', async () => {
    const widget = await CarouselWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        playbackMode: 'inline',
        style: { gap: '8px' },
      },
    });

    widget.destroy();

    await CarouselWidget.create(mockConfiguration);

    expect(container.className).toBe('widget-container qc-widget qc-carousel-widget qc-carousel-widget--multi');
    expect(container.style.getPropertyValue('--qc-lw-gap')).toBe('');
  });

  it('should remove the style attribute on destroy when the container had none', async () => {
    const widget = await CarouselWidget.create(mockConfiguration);

    widget.destroy();

    expect(container.hasAttribute('style')).toBe(false);
  });
});
