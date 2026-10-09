import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { ListWidget } from '@/widgets/list-widget';
import { ListWidgetConfiguration } from '@/interfaces/list-widget';
import { PresentationService } from '@/services/presentation.service';
import { Presentation } from '@/interfaces/presentation';

vi.mock('@/services/presentation.service');

describe('ListWidget', () => {
  const mockConfiguration: ListWidgetConfiguration = {
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
    await expect(() => ListWidget.create({
      ...mockConfiguration,
      source: { host: 'example.com' } as ListWidgetConfiguration['source'],
    })).rejects.toThrow('`source` must define exactly one of');
  });

  it('should fetch the presentations with the resolved source', async () => {
    await ListWidget.create(mockConfiguration);

    expect(getPresentationsMock).toHaveBeenCalledWith({
      host: 'example.com',
      limit: 12,
      smartSearchGuid: 'playlist-guid',
    });
  });

  it('should render the list in the container', async () => {
    await ListWidget.create({
      ...mockConfiguration,
      selector: container,
      widgetOptions: { layout: 'vertical' },
    });

    expect(container.classList.contains('qc-widget')).toBe(true);
    expect(container.classList.contains('qc-list-widget')).toBe(true);
    expect(container.classList.contains('qc-list-widget--vertical')).toBe(true);
    expect(container.querySelectorAll('.qc-list-item')).toHaveLength(2);
  });

  it('should render the empty state when there are no presentations', async () => {
    getPresentationsMock.mockResolvedValueOnce({
      presentations: [],
      total: 0,
    });

    await ListWidget.create(mockConfiguration);

    expect(container.querySelector('.qc-not-found')?.textContent).toBe('No presentations found');
  });

  it('should render the empty state when the fetch fails', async () => {
    getPresentationsMock.mockRejectedValueOnce(new Error('boom'));

    await ListWidget.create(mockConfiguration);

    expect(console.error).toHaveBeenCalled();
    expect(container.querySelector('.qc-not-found')).not.toBeNull();
  });

  it('should throw when the container is not found', async () => {
    await expect(() => ListWidget.create({
      ...mockConfiguration,
      selector: '.missing',
    })).rejects.toThrow('Element for selector ".missing" not found');
  });

  it('should set the style as CSS custom properties', async () => {
    await ListWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        style: {
          closeButton: { color: 'red' },
          columns: 3,
          dialog: { maxWidth: '800px' },
          gap: '24px',
          item: {
            activeBorder: '2px solid red',
            borderRadius: '8px',
            durationBadge: {
              fontFamily: 'monospace',
              fontWeight: '600',
              letterSpacing: '1px',
              position: 'top-left',
              textTransform: 'uppercase',
            },
            fieldGap: '6px',
            hoverBorder: '2px solid blue',
            metadata: { title: { color: 'blue' } },
            playButton: { position: 'top-right' },
            thumbnail: { aspectRatio: '4:3' },
            thumbnailGap: '20px',
          },
          minItemWidth: '200px',
        },
      },
    });

    const style = (name: string) => container.style.getPropertyValue(name);

    expect(style('--qc-lw-gap')).toBe('24px');
    expect(style('--qc-lw-min-item-width')).toBe('200px');
    expect(style('--qc-lw-grid-template-columns'))
      .toBe('repeat(auto-fill, minmax(min(max(var(--qc-lw-min-item-width), (100% - 2 * var(--qc-lw-gap)) / 3), 100%), 1fr))');
    expect(style('--qc-lw-item-border-radius')).toBe('8px');
    expect(style('--qc-lw-item-hover-border')).toBe('2px solid blue');
    expect(style('--qc-lw-item-field-gap')).toBe('6px');
    expect(style('--qc-lw-item-thumbnail-gap')).toBe('20px');
    expect(style('--qc-lw-item-active-border')).toBe('2px solid red');
    expect(style('--qc-lw-item-duration-badge-font-weight')).toBe('600');
    expect(style('--qc-lw-item-duration-badge-font-family')).toBe('monospace');
    expect(style('--qc-lw-item-duration-badge-letter-spacing')).toBe('1px');
    expect(style('--qc-lw-item-duration-badge-text-transform')).toBe('uppercase');
    expect(style('--qc-lw-item-duration-badge-position')).toBe('start start');
    expect(style('--qc-lw-item-thumbnail-aspect-ratio')).toBe('4/3');
    expect(style('--qc-lw-item-play-button-position')).toBe('start end');
    // shared with the presentation widget components
    expect(style('--qc-pw-dialog-max-width')).toBe('800px');
    expect(style('--qc-pw-close-button-color')).toBe('red');
    // metadata styles are applied per field, not on the container
    expect(container.getAttribute('style')).not.toContain('metadata');
    expect(container.querySelector<HTMLElement>('[data-field="title"]')!.style.getPropertyValue('--qc-lw-field-color')).toBe('blue');
  });

  it('should send the telemetry', async () => {
    const onItemClick = vi.fn();

    await ListWidget.create({
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
      type: 'list',
      widgetOptions: {
        layout: 'grid',
        onItemClick: true,
      },
    });
  });

  it('should not send the telemetry when disabled', async () => {
    // eslint-disable-next-line no-underscore-dangle
    globalThis.window.__QUMU_WIDGET_TELEMETRY__ = false;

    await ListWidget.create(mockConfiguration);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();

    // eslint-disable-next-line no-underscore-dangle
    delete globalThis.window.__QUMU_WIDGET_TELEMETRY__;
  });

  it('should destroy the widget', async () => {
    const widget = await ListWidget.create(mockConfiguration);

    widget.destroy();
    widget.destroy();

    expect(container.innerHTML).toBe('');
  });

  it('should restore the classes and the style of the container on destroy', async () => {
    container.style.setProperty('margin', '8px');

    const widget = await ListWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        layout: 'vertical',
        style: {
          columns: 3,
          gap: '24px',
        },
      },
    });

    expect(container.className).toBe('widget-container qc-widget qc-list-widget qc-list-widget--vertical');
    expect(container.style.getPropertyValue('--qc-lw-gap')).toBe('24px');

    widget.destroy();

    expect(container.className).toBe('widget-container');
    expect(container.getAttribute('style')).toBe('margin: 8px;');
  });

  it('should not keep the classes and the style of a destroyed widget', async () => {
    const widget = await ListWidget.create({
      ...mockConfiguration,
      widgetOptions: {
        layout: 'vertical',
        style: { columns: 3 },
      },
    });

    widget.destroy();

    await ListWidget.create(mockConfiguration);

    expect(container.className).toBe('widget-container qc-widget qc-list-widget qc-list-widget--grid');
    expect(container.style.getPropertyValue('--qc-lw-grid-template-columns')).toBe('');
  });

  it('should remove the style attribute on destroy when the container had none', async () => {
    const widget = await ListWidget.create(mockConfiguration);

    widget.destroy();

    expect(container.hasAttribute('style')).toBe(false);
  });
});
