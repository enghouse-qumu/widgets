import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarouselConfigurationService } from '../carousel-configuration.service';
import { CarouselWidgetConfiguration } from '@/interfaces/carousel-widget';

describe('CarouselConfigurationService', () => {
  const service = new CarouselConfigurationService();

  const baseConfiguration: CarouselWidgetConfiguration = {
    selector: '#widget',
    source: {
      host: 'https://example.com/some/path',
      smartSearchGuid: 'playlist-guid',
    },
  };

  const create = (configuration: unknown) => service.createConfiguration(configuration as CarouselWidgetConfiguration);
  const withOptions = (widgetOptions: unknown) => create({ ...baseConfiguration,
    widgetOptions });

  beforeEach(() => {
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('defaults', () => {
    it('should apply the defaults', () => {
      const configuration = create(baseConfiguration);

      expect(configuration.source).toEqual({
        host: 'example.com',
        limit: 12,
        smartSearchGuid: 'playlist-guid',
      });
      expect(configuration.widgetOptions).toEqual({
        item: {
          info: {
            bottom: [
              { field: 'title' },
              { field: 'publishOn' },
            ],
          },
          showDurationOverlay: true,
        },
        navigation: {
          arrows: true,
          dots: true,
        },
        playbackMode: 'modal',
        style: {},
      });
    });

    it('should show all the listed presentations by default', () => {
      const configuration = create({
        ...baseConfiguration,
        source: {
          host: 'example.com',
          presentationGuids: ['a', 'b', 'c'],
        },
      });

      expect(configuration.source.limit).toBe(3);
    });

    it('should keep the provided options', () => {
      const info = { top: [{ field: 'title' }] };
      const configuration = withOptions({
        item: {
          info,
          showDurationOverlay: false,
        },
        navigation: { dots: false },
        playbackMode: 'inline',
      });

      expect(configuration.widgetOptions.item).toEqual({
        info,
        showDurationOverlay: false,
      });
      expect(configuration.widgetOptions.navigation).toEqual({
        arrows: true,
        dots: false,
      });
      expect(configuration.widgetOptions.playbackMode).toBe('inline');
    });
  });

  describe('validation', () => {
    it('should validate the selector and the source like the list widget', () => {
      expect(() => create({ source: baseConfiguration.source })).toThrow('`selector` is not defined in the configuration');
      expect(() => create({
        ...baseConfiguration,
        source: { host: 'example.com' },
      })).toThrow('`source` must define exactly one of');
    });

    it('should remove the unsupported fields with a warning', () => {
      const configuration = create({
        ...baseConfiguration,
        unknown: true,
        widgetOptions: {
          layout: 'grid',
          navigation: { autoplay: true },
        },
      });

      expect(configuration).not.toHaveProperty('unknown');
      expect(configuration.widgetOptions).not.toHaveProperty('layout');
      expect(configuration.widgetOptions.navigation).toEqual({
        arrows: true,
        dots: true,
      });
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `unknown` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.layout` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.navigation.autoplay` in configuration');
    });

    it('should not modify the given configuration', () => {
      const widgetOptions = {
        navigation: { autoplay: true },
        playbackMode: 'inline',
        style: { columns: 3 },
      };

      withOptions(widgetOptions);

      expect(widgetOptions).toEqual({
        navigation: { autoplay: true },
        playbackMode: 'inline',
        style: { columns: 3 },
      });
    });

    it('should reject an unknown playback mode', () => {
      expect(() => withOptions({ playbackMode: 'popup' })).toThrow('`widgetOptions.playbackMode` must be either');
    });

    it.each(['onIframeLoad', 'onItemClick'])('should reject a %s that is not a function', (field) => {
      expect(() => withOptions({ [field]: 'nope' })).toThrow(`\`widgetOptions.${field}\` must be a function`);
    });

    it.each(['nextIconUrl', 'previousIconUrl'])('should reject a %s that is not a string', (field) => {
      expect(() => withOptions({ [field]: 42 })).toThrow(`\`widgetOptions.${field}\` must be a string`);
    });

    it('should keep the custom arrow icons', () => {
      const configuration = withOptions({
        nextIconUrl: 'next.svg',
        previousIconUrl: 'previous.svg',
      });

      expect(configuration.widgetOptions).toMatchObject({
        nextIconUrl: 'next.svg',
        previousIconUrl: 'previous.svg',
      });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should reject an invalid navigation', () => {
      expect(() => withOptions({ navigation: 'none' })).toThrow('`widgetOptions.navigation` must be an object');
      expect(() => withOptions({ navigation: { arrows: 'no' } })).toThrow('`widgetOptions.navigation.arrows` must be a boolean');
    });

    it('should only accept the top and bottom info slots', () => {
      expect(() => withOptions({ item: { info: { left: [{ field: 'title' }] } } }))
        .toThrow('`widgetOptions.item.info.left` is not a supported slot, use "top" or "bottom"');
      expect(() => withOptions({ item: { info: { bottom: [{ field: '' }] } } }))
        .toThrow('`widgetOptions.item.info.bottom[0].field` must be a non-empty string');
    });

    it('should validate the columns', () => {
      expect(() => withOptions({ style: { columns: 0 } })).toThrow('`widgetOptions.style.columns` must be either "auto" or a positive integer');
    });

    it.each(['inline', 'inline-autoload', 'inline-autoplay'])('should ignore the columns and the min item width in the %s mode', (playbackMode) => {
      const configuration = withOptions({
        playbackMode,
        style: {
          columns: 3,
          gap: '8px',
          minItemWidth: '200px',
        },
      });

      expect(configuration.widgetOptions.style).toEqual({ gap: '8px' });
      expect(console.warn).toHaveBeenCalledWith(`\`widgetOptions.style.columns\` is not supported with the "${playbackMode}" playback mode, a page shows a single item`);
      expect(console.warn).toHaveBeenCalledWith(`\`widgetOptions.style.minItemWidth\` is not supported with the "${playbackMode}" playback mode, a page shows a single item`);
    });

    it('should keep the columns in the modal mode', () => {
      const configuration = withOptions({ style: { columns: 3 } });

      expect(configuration.widgetOptions.style.columns).toBe(3);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should validate the arrows position and the dots placement', () => {
      expect(() => withOptions({ style: { arrows: { position: 'inside' } } }))
        .toThrow('`widgetOptions.style.arrows.position` must be either "overlay" or "outside"');
      expect(() => withOptions({ style: { dots: { placement: 'left' } } }))
        .toThrow('`widgetOptions.style.dots.placement` must be either "bottom" or "top"');
    });
  });
});
