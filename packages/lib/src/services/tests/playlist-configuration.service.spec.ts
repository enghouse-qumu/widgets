import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaylistConfigurationService } from '../playlist-configuration.service';
import { PlaylistItemTemplateConfig, PlaylistWidgetConfiguration } from '@/interfaces/playlist-widget';

describe('PlaylistConfigurationService', () => {
  const service = new PlaylistConfigurationService();
  const baseConfiguration: PlaylistWidgetConfiguration = {
    selector: '#playlist',
    source: {
      host: 'https://example.com/some/path',
      smartSearchGuid: 'smart-search-guid',
    },
  };

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('defaults', () => {
    it('should apply the defaults', () => {
      const configuration = service.createConfiguration(baseConfiguration);

      expect(configuration.source).toEqual({
        host: 'example.com',
        limit: 100,
        smartSearchGuid: 'smart-search-guid',
      });
      expect(configuration.playerParameters).toEqual({});
      expect(configuration.widgetOptions).toEqual({
        controls: {
          audienceReactions: true,
          audioTracks: true,
          captions: true,
          fullscreen: true,
          playbackRate: true,
          quality: true,
          volume: true,
        },
        item: {
          info: {
            left: [{ field: 'title' }],
            right: [{
              field: 'duration',
              label: false,
            }],
          },
        },
        loop: false,
        playbackMode: 'inline',
        showPlayer: true,
        style: {},
        trackProgress: true,
      });
    });

    it('should default the limit to the number of presentation GUIDs', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        source: {
          host: 'example.com',
          presentationGuids: ['a', 'b', 'c'],
        },
      });

      expect(configuration.source.limit).toBe(3);
    });

    it('should keep the given limit', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        source: {
          ...baseConfiguration.source,
          limit: 5,
        },
      });

      expect(configuration.source.limit).toBe(5);
    });

    it('should merge the given controls with the defaults', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { controls: { fullscreen: false } },
      });

      expect(configuration.widgetOptions.controls.fullscreen).toBe(false);
      expect(configuration.widgetOptions.controls.volume).toBe(true);
    });

    it('should replace the default item fields with the given ones', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { item: { info: { left: [{ field: 'publisher' }] } } },
      });

      expect(configuration.widgetOptions.item).toEqual({ info: { left: [{ field: 'publisher' }] } });
    });

    it('should send the lowest quality for a hidden player', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { showPlayer: false },
      });

      expect(configuration.playerParameters.quality).toBe('240p');
    });

    it('should keep the given quality for a hidden player', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        playerParameters: { quality: '720p' },
        widgetOptions: { showPlayer: false },
      });

      expect(configuration.playerParameters.quality).toBe('720p');
    });

    it('should let the single item loop win over the playlist loop', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        playerParameters: { loop: true },
        widgetOptions: { loop: true },
      });

      expect(configuration.widgetOptions.loop).toBe(false);
      expect(configuration.playerParameters.loop).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('`playerParameters.loop`'));
    });
  });

  describe('validation', () => {
    it.each([
      [null, 'Configuration must be a valid object'],
      [{ source: baseConfiguration.source }, '`selector` is not defined in the configuration'],
      [{ selector: '#playlist' }, '`source` is not defined in the configuration'],
      [{
        ...baseConfiguration,
        selector: '  ',
      }, '`selector` cannot be an empty string'],
      [{
        ...baseConfiguration,
        selector: 1,
      }, '`selector` must be a string or an instance of HTMLElement'],
      [{
        ...baseConfiguration,
        source: 'source',
      }, '`source` must be a valid object'],
    ])('should reject an invalid configuration %#', (configuration, message) => {
      expect(() => service.createConfiguration(configuration as unknown as PlaylistWidgetConfiguration)).toThrow(message);
    });

    it('should validate the source like the ListWidget', () => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        source: { host: 'example.com' } as PlaylistWidgetConfiguration['source'],
      })).toThrow('`source` must define exactly one of');
    });

    it('should remove the unsupported fields with a warning', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        unknown: true,
        widgetOptions: {
          controls: { download: true },
          item: { info: {},
            showDurationOverlay: true },
          layout: 'grid',
        },
      } as unknown as PlaylistWidgetConfiguration);

      expect(configuration).not.toHaveProperty('unknown');
      expect(configuration.widgetOptions).not.toHaveProperty('layout');
      expect(configuration.widgetOptions.controls).not.toHaveProperty('download');
      expect(configuration.widgetOptions.item).not.toHaveProperty('showDurationOverlay');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `unknown` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.layout` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.controls.download` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.item.showDurationOverlay` in configuration');
    });

    it('should drop `showControlPanel`, the widget renders its own controls', () => {
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        playerParameters: {
          showControlPanel: true,
          volume: 50,
        },
      });

      expect(configuration.playerParameters).toEqual({ volume: 50 });
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('`playerParameters.showControlPanel` is not supported'));
    });

    it('should validate the player parameters', () => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        playerParameters: { pv: 'invalid' as 'sbs' },
      })).toThrow('`playerParameters.pv` must be either');
    });

    it('should reject the modal playback mode', () => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { playbackMode: 'modal' as 'inline' },
      })).toThrow('`widgetOptions.playbackMode` must be either "inline", "inline-autoload" or "inline-autoplay"');
    });

    it.each(['loop', 'showPlayer', 'trackProgress'])('should reject a non-boolean `%s`', (field) => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { [field]: 'yes' },
      })).toThrow(`\`widgetOptions.${field}\` must be a boolean`);
    });

    it.each(['onIframeLoad', 'onItemChange', 'onPlaylistEnd'])('should reject a non-function `%s`', (field) => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { [field]: 'callback' },
      })).toThrow(`\`widgetOptions.${field}\` must be a function`);
    });

    it('should reject the non-boolean controls', () => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { controls: { volume: 'no' as unknown as boolean } },
      })).toThrow('`widgetOptions.controls.volume` must be a boolean');
    });

    it('should ignore the top and bottom slots, playlist rows only have the left and right slots', () => {
      const info = {
        bottom: [{ field: 'summary' }],
        right: [{ field: 'duration' }],
      };
      const configuration = service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { item: { info: info as PlaylistItemTemplateConfig['info'] } },
      });

      expect(configuration.widgetOptions.item.info).toEqual({ right: [{ field: 'duration' }] });
      // the given object is not modified
      expect(info).toHaveProperty('bottom');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('`widgetOptions.item.info.bottom` is not supported'));
    });

    it('should validate the item fields', () => {
      expect(() => service.createConfiguration({
        ...baseConfiguration,
        widgetOptions: { item: { info: { left: [{ field: '' }] } } },
      })).toThrow('`widgetOptions.item.info.left[0].field` must be a non-empty string');
    });
  });
});
