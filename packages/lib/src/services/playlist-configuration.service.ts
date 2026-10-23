import {
  PlaylistControls,
  PlaylistInfoSlot,
  PlaylistItemTemplateConfig,
  PlaylistWidgetConfiguration,
  PlaylistWidgetOptions,
} from '@/interfaces/playlist-widget';
import { ListWidgetSource } from '@/interfaces/list-widget-source';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { ConfigurationService } from '@/services/configuration.service';
import { ListConfigurationService } from '@/services/list-configuration.service';

const supportedConfigFields = new Set([
  'selector',
  'source',
  'locales',
  'widgetOptions',
  'playerParameters',
]);
const supportedWidgetFields = new Set([
  'controls',
  'item',
  'loop',
  'playbackMode',
  'playIconUrl',
  'showPlayer',
  'style',
  'trackProgress',
  'onIframeLoad',
  'onItemChange',
  'onPlaylistEnd',
]);
const playlistInfoSlots: PlaylistInfoSlot[] = ['left', 'right'];

// the maximum number of presentations fetched by default (legacy: 1000)
export const PLAYLIST_DEFAULT_LIMIT = 100;

export const defaultControls: PlaylistControls = {
  audienceReactions: true,
  audioTracks: true,
  captions: true,
  fullscreen: true,
  playbackRate: true,
  quality: true,
  volume: true,
};

export const defaultPlaylistItem: PlaylistItemTemplateConfig = {
  info: {
    left: [{ field: 'title' }],
    right: [
      {
        field: 'duration',
        label: false,
      },
    ],
  },
};

export interface ResolvedPlaylistWidgetConfiguration extends PlaylistWidgetConfiguration {
  playerParameters: Partial<PlayerParameters>;
  widgetOptions: Partial<PlaylistWidgetOptions>
    & Pick<PlaylistWidgetOptions, 'loop' | 'playbackMode' | 'showPlayer' | 'style' | 'trackProgress'>
    & {
      controls: PlaylistControls;
      item: PlaylistItemTemplateConfig;
    };
}

export class PlaylistConfigurationService {
  private readonly configurationService = new ConfigurationService();
  private readonly listConfigurationService = new ListConfigurationService();

  createConfiguration(initialConfiguration: PlaylistWidgetConfiguration): ResolvedPlaylistWidgetConfiguration {
    const configuration = this.validateAndSanitize(initialConfiguration);
    const widgetOptions = configuration.widgetOptions ?? {};
    const playerParameters = { ...configuration.playerParameters };
    const showPlayer = widgetOptions.showPlayer ?? true;

    let loop = widgetOptions.loop ?? false;

    if (playerParameters.loop && loop) {
      console.warn('`playerParameters.loop` loops the current item and disables `widgetOptions.loop`');
      loop = false;
    }

    // a hidden video does not need to be decoded in full resolution
    if (!showPlayer && playerParameters.quality === undefined) {
      playerParameters.quality = '240p';
    }

    return {
      ...configuration,
      playerParameters,
      source: {
        ...configuration.source,
        host: configuration.source.host
          .replace('https://', '')
          .split('/')[0],
        // all the listed presentations are shown by default
        limit: configuration.source.limit
          ?? ('presentationGuids' in configuration.source ? configuration.source.presentationGuids.length : PLAYLIST_DEFAULT_LIMIT),
      },
      widgetOptions: {
        ...widgetOptions,
        controls: {
          ...defaultControls,
          ...widgetOptions.controls,
        },
        item: {
          // a provided `info` replaces the defaults entirely, so fields can also be removed
          info: widgetOptions.item?.info ?? defaultPlaylistItem.info,
        },
        loop,
        playbackMode: widgetOptions.playbackMode ?? 'inline',
        showPlayer,
        style: { ...widgetOptions.style },
        trackProgress: widgetOptions.trackProgress ?? true,
      },
    };
  }

  private validateAndSanitize(initialConfiguration: PlaylistWidgetConfiguration): PlaylistWidgetConfiguration {
    this.listConfigurationService.validateSelectorAndSource(initialConfiguration);

    const configuration: PlaylistWidgetConfiguration = {
      ...initialConfiguration,
      playerParameters: { ...initialConfiguration.playerParameters },
      source: { ...initialConfiguration.source } as ListWidgetSource,
      widgetOptions: {
        ...initialConfiguration.widgetOptions,
        // copied, the unsupported fields are removed below
        ...(initialConfiguration.widgetOptions?.controls && { controls: { ...initialConfiguration.widgetOptions.controls } }),
        ...(initialConfiguration.widgetOptions?.item && { item: { ...initialConfiguration.widgetOptions.item } }),
      },
    };

    Object.keys(configuration).forEach((field) => {
      if (!supportedConfigFields.has(field)) {
        console.warn(`Unsupported field \`${field}\` in configuration`);
        delete configuration[field as keyof PlaylistWidgetConfiguration];
      }
    });

    this.listConfigurationService.validateSource(configuration.source);
    this.configurationService.validatePlayerParameters(configuration.playerParameters);
    this.validatePlayerParameters(configuration.playerParameters!);
    this.validateWidgetOptions(configuration.widgetOptions!);

    return configuration;
  }

  private validatePlayerParameters(playerParameters: Partial<PlayerParameters>): void {
    // the widget renders its own controls
    if (playerParameters.showControlPanel !== undefined) {
      console.warn('`playerParameters.showControlPanel` is not supported, the PlaylistWidget renders its own controls');
      delete playerParameters.showControlPanel;
    }
  }

  private validateWidgetOptions(widgetOptions: Partial<PlaylistWidgetOptions>): void {
    Object.keys(widgetOptions).forEach((field) => {
      if (!supportedWidgetFields.has(field)) {
        console.warn(`Unsupported field \`widgetOptions.${field}\` in configuration`);
        delete widgetOptions[field as keyof typeof widgetOptions];
      }
    });

    if (widgetOptions.playbackMode !== undefined && !['inline', 'inline-autoload', 'inline-autoplay'].includes(widgetOptions.playbackMode)) {
      throw new Error('`widgetOptions.playbackMode` must be either "inline", "inline-autoload" or "inline-autoplay"');
    }

    (['loop', 'showPlayer', 'trackProgress'] as const).forEach((field) => {
      if (widgetOptions[field] !== undefined && typeof widgetOptions[field] !== 'boolean') {
        throw new TypeError(`\`widgetOptions.${field}\` must be a boolean`);
      }
    });

    (['onIframeLoad', 'onItemChange', 'onPlaylistEnd'] as const).forEach((field) => {
      if (widgetOptions[field] !== undefined && typeof widgetOptions[field] !== 'function') {
        throw new TypeError(`\`widgetOptions.${field}\` must be a function`);
      }
    });

    this.validateControls(widgetOptions.controls);
    this.validateItem(widgetOptions.item);
  }

  private validateControls(controls: Partial<PlaylistControls> | undefined): void {
    if (controls === undefined) {
      return;
    }

    if (!controls || typeof controls !== 'object') {
      throw new TypeError('`widgetOptions.controls` must be an object');
    }

    Object.keys(controls).forEach((field) => {
      if (!(field in defaultControls)) {
        console.warn(`Unsupported field \`widgetOptions.controls.${field}\` in configuration`);
        delete controls[field as keyof PlaylistControls];
      } else if (typeof controls[field as keyof PlaylistControls] !== 'boolean') {
        throw new TypeError(`\`widgetOptions.controls.${field}\` must be a boolean`);
      }
    });
  }

  private validateItem(item: Partial<PlaylistItemTemplateConfig> | undefined): void {
    if (item === undefined) {
      return;
    }

    if (!item || typeof item !== 'object') {
      throw new TypeError('`widgetOptions.item` must be an object');
    }

    Object.keys(item).forEach((field) => {
      if (field !== 'info') {
        console.warn(`Unsupported field \`widgetOptions.item.${field}\` in configuration`);
        delete item[field as keyof PlaylistItemTemplateConfig];
      }
    });

    // the other values are rejected by `validateItemInfo()`
    if (item.info && typeof item.info === 'object' && !Array.isArray(item.info)) {
      // copied, the caller's object is not modified
      const info: Record<string, unknown> = { ...item.info };

      // playlist rows only have the left and right slots
      Object.keys(info).forEach((slot) => {
        if (!playlistInfoSlots.includes(slot as PlaylistInfoSlot)) {
          console.warn(`\`widgetOptions.item.info.${slot}\` is not supported by the PlaylistWidget, use "left" or "right"`);
          delete info[slot];
        }
      });

      item.info = info as PlaylistItemTemplateConfig['info'];
    }

    this.listConfigurationService.validateItemInfo(item.info);
  }
}
