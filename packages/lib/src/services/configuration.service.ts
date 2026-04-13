import { PlayerParameters } from '@/interfaces/player-parameters';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';
import { WidgetOptions } from '@/interfaces/widget-options';

const supportedConfigFields = new Set([
  'selector',
  'host',
  'guid',
  'layout',
  'locales',
  'widgetOptions',
  'playerParameters',
  'sortBy',
  'sortOrder',
]);
const supportedWidgetFields = new Set([
  'playbackMode',
  'playIconUrl',
  'style',
  'onIframeLoad',
  'onThumbnailClick',
]);
const supportedPlayerParameterFields = new Set([
  'audio',
  'captions',
  'debug',
  'loop',
  'playerConfigurationGuid',
  'pv',
  'quality',
  'showControlPanel',
  'sidebar',
  'speech',
  'speechTerm',
  'start',
  'volume',
  'reporting',
  'reportingId',
]);

export class ConfigurationService {
  createConfiguration(initialConfiguration: WidgetConfiguration): WidgetConfiguration {
    const configuration = this.validateAndSanitize(initialConfiguration);

    const widgetOptions = {
      playbackMode: 'inline',
      ...configuration.widgetOptions,
    } as WidgetOptions;

    const playerParameters = {
      ...configuration.playerParameters,
    };

    return {
      ...configuration,
      host: configuration.host
        .replace('https://', '')
        .split('/')[0],
      playerParameters,
      widgetOptions,
    };
  }

  private validateAndSanitize(initialConfiguration: WidgetConfiguration): WidgetConfiguration {
    if (!initialConfiguration || typeof initialConfiguration !== 'object') {
      throw new Error('Configuration must be a valid object');
    }

    ['selector', 'host', 'guid'].forEach((field) => {
      if (!Object.hasOwn(initialConfiguration, field)) {
        throw new Error(`\`${field}\` is not defined in the configuration`);
      }
    });

    ['selector', 'host', 'guid', 'sortBy'].forEach((field) => {
      const value = initialConfiguration[field as keyof WidgetConfiguration];

      if (!Object.hasOwn(initialConfiguration, field)) {
        return;
      }

      if (value === undefined || value === null) {
        throw new Error(`\`${field}\` is undefined or null`);
      }

      if (field === 'selector' && value instanceof HTMLElement) {
        return;
      }

      if (typeof value !== 'string') {
        throw new TypeError(`\`${field}\` must be a string${field === 'selector' ? ' or an instance of HTMLElement' : ''}`);
      }

      if (value.trim() === '') {
        throw new Error(`\`${field}\` cannot be an empty string`);
      }
    });

    if (Object.hasOwn(initialConfiguration, 'sortOrder') && !['ASCENDING', 'DESCENDING'].includes(initialConfiguration.sortOrder!)) {
      throw new Error('`sortOrder` must be either "ASCENDING" or "DESCENDING"');
    }

    const configuration = {
      ...initialConfiguration,
      playerParameters: { ...initialConfiguration.playerParameters },
      widgetOptions: { ...initialConfiguration.widgetOptions },
    };

    Object.keys(configuration).forEach((field) => {
      if (!supportedConfigFields.has(field)) {
        console.warn(`Unsupported field \`${field}\` in configuration`);
        delete configuration[field as keyof WidgetConfiguration];
      }
    });

    try {
      // eslint-disable-next-line no-new
      new URL(`https://${configuration.host.replace('https://', '')}`);
    } catch {
      throw new Error('`host` must be a valid domain name');
    }

    this.validatePlayerParameters(configuration.playerParameters);
    this.validateWidgetOptions(configuration.widgetOptions);

    return configuration;
  }

  private validatePlayerParameters(playerParameters: Partial<PlayerParameters> | undefined): void {
    if (!playerParameters) {
      return;
    }

    Object.keys(playerParameters).forEach((field) => {
      if (!supportedPlayerParameterFields.has(field)) {
        console.warn(`Unsupported field \`playerParameters.${field}\` in configuration`);
        delete playerParameters[field as keyof typeof playerParameters];
      }
    });


    if (playerParameters.pv !== undefined && !['pipls', 'pipss', 'sbs'].includes(playerParameters.pv)) {
      throw new Error('`playerParameters.pv` must be either "pipls", "pipss" or "sbs"');
    }

    if (playerParameters.quality !== undefined && !['240p', '480p', '720p', '1080p', '1440p', 'auto', 'best'].includes(playerParameters.quality)) {
      throw new Error('`playerParameters.quality` must be either "240p", "480p", "720p", "1080p", "1440p", "auto" or "best"');
    }
  }

  private validateWidgetOptions(widgetOptions: Partial<WidgetOptions> | undefined): void {
    if (!widgetOptions) {
      return;
    }

    Object.keys(widgetOptions).forEach((field) => {
      if (!supportedWidgetFields.has(field)) {
        console.warn(`Unsupported field \`widgetOptions.${field}\` in configuration`);
        delete widgetOptions[field as keyof typeof widgetOptions];
      }
    });

    if (widgetOptions.playbackMode !== undefined) {
      const value = widgetOptions.playbackMode;

      if (!['inline', 'inline-autoload', 'inline-autoplay', 'modal'].includes(value)) {
        throw new Error('`widgetOptions.playbackMode` must be either "inline", "inline-autoload", "inline-autoplay" or "modal"');
      }
    }

    if (widgetOptions.onIframeLoad !== undefined) {
      if (typeof widgetOptions.onIframeLoad !== 'function') {
        throw new TypeError('`widgetOptions.onIframeLoad` must be a function');
      }
    }

    if (widgetOptions.onThumbnailClick !== undefined) {
      if (![undefined, 'inline'].includes(widgetOptions.playbackMode)) {
        console.warn('`widgetOptions.onThumbnailClick` is only applicable when `widgetOptions.playbackMode` is "inline"');
        delete widgetOptions.onThumbnailClick;
      } else if (typeof widgetOptions.onThumbnailClick !== 'function') {
        throw new TypeError('`widgetOptions.onThumbnailClick` must be a function');
      }
    }
  }
}
