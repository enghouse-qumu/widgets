import { CarouselInfoSlot, CarouselItemTemplateConfig, CarouselWidgetConfiguration, CarouselWidgetOptions } from '@/interfaces/carousel-widget';
import { ListWidgetSource } from '@/interfaces/list-widget-source';
import { ConfigurationService } from '@/services/configuration.service';
import { layoutDefaults, ListConfigurationService } from '@/services/list-configuration.service';

const supportedConfigFields = new Set([
  'selector',
  'source',
  'locales',
  'widgetOptions',
  'playerParameters',
]);
const supportedWidgetFields = new Set([
  'item',
  'navigation',
  'nextIconUrl',
  'playbackMode',
  'playIconUrl',
  'previousIconUrl',
  'style',
  'onIframeLoad',
  'onItemClick',
]);
const supportedNavigationFields = new Set(['arrows', 'dots']);
const playbackModes = ['inline', 'inline-autoload', 'inline-autoplay', 'modal'];
const infoSlots: CarouselInfoSlot[] = ['top', 'bottom'];
const defaultLimit = 12;

export interface ResolvedCarouselWidgetConfiguration extends CarouselWidgetConfiguration {
  widgetOptions: Partial<CarouselWidgetOptions> & Pick<CarouselWidgetOptions, 'playbackMode' | 'style'> & {
    item: CarouselItemTemplateConfig;
    navigation: Required<CarouselWidgetOptions['navigation']>;
  };
}

export class CarouselConfigurationService {
  private readonly configurationService = new ConfigurationService();
  private readonly listConfigurationService = new ListConfigurationService();

  createConfiguration(initialConfiguration: CarouselWidgetConfiguration): ResolvedCarouselWidgetConfiguration {
    const configuration = this.validateAndSanitize(initialConfiguration);
    const { item, navigation } = configuration.widgetOptions ?? {};

    return {
      ...configuration,
      playerParameters: { ...configuration.playerParameters },
      source: this.listConfigurationService.resolveSource(configuration.source, defaultLimit),
      widgetOptions: {
        ...configuration.widgetOptions,
        item: {
          // the same default as the grid layout of the list widget; a provided `info` replaces it entirely
          info: item?.info ?? layoutDefaults.grid.info,
          showDurationOverlay: item?.showDurationOverlay ?? true,
        },
        navigation: {
          arrows: navigation?.arrows ?? true,
          dots: navigation?.dots ?? true,
        },
        playbackMode: configuration.widgetOptions?.playbackMode ?? 'modal',
        style: { ...configuration.widgetOptions?.style },
      },
    };
  }

  private validateAndSanitize(initialConfiguration: CarouselWidgetConfiguration): CarouselWidgetConfiguration {
    this.listConfigurationService.validateSelectorAndSource(initialConfiguration);

    const configuration: CarouselWidgetConfiguration = {
      ...initialConfiguration,
      playerParameters: { ...initialConfiguration.playerParameters },
      source: { ...initialConfiguration.source } as ListWidgetSource,
      widgetOptions: {
        ...initialConfiguration.widgetOptions,
        style: { ...initialConfiguration.widgetOptions?.style },
      },
    };

    Object.keys(configuration).forEach((field) => {
      if (!supportedConfigFields.has(field)) {
        console.warn(`Unsupported field \`${field}\` in configuration`);
        delete configuration[field as keyof CarouselWidgetConfiguration];
      }
    });

    this.listConfigurationService.validateSource(configuration.source);
    this.configurationService.validatePlayerParameters(configuration.playerParameters);
    this.validateWidgetOptions(configuration.widgetOptions!);

    return configuration;
  }

  private validateWidgetOptions(widgetOptions: Partial<CarouselWidgetOptions>): void {
    Object.keys(widgetOptions).forEach((field) => {
      if (!supportedWidgetFields.has(field)) {
        console.warn(`Unsupported field \`widgetOptions.${field}\` in configuration`);
        delete widgetOptions[field as keyof typeof widgetOptions];
      }
    });

    if (widgetOptions.playbackMode !== undefined && !playbackModes.includes(widgetOptions.playbackMode)) {
      throw new Error('`widgetOptions.playbackMode` must be either "inline", "inline-autoload", "inline-autoplay" or "modal"');
    }

    (['onIframeLoad', 'onItemClick'] as const).forEach((field) => {
      if (widgetOptions[field] !== undefined && typeof widgetOptions[field] !== 'function') {
        throw new TypeError(`\`widgetOptions.${field}\` must be a function`);
      }
    });

    (['nextIconUrl', 'previousIconUrl'] as const).forEach((field) => {
      if (widgetOptions[field] !== undefined && typeof widgetOptions[field] !== 'string') {
        throw new TypeError(`\`widgetOptions.${field}\` must be a string`);
      }
    });

    this.validateNavigation(widgetOptions);
    this.validateStyle(widgetOptions);
    this.listConfigurationService.validateItemInfo(widgetOptions.item?.info, infoSlots);
  }

  private validateNavigation(widgetOptions: Partial<CarouselWidgetOptions>): void {
    if (widgetOptions.navigation === undefined) {
      return;
    }

    if (!widgetOptions.navigation || typeof widgetOptions.navigation !== 'object' || Array.isArray(widgetOptions.navigation)) {
      throw new TypeError('`widgetOptions.navigation` must be an object');
    }

    const navigation = { ...widgetOptions.navigation };

    Object.keys(navigation).forEach((field) => {
      if (!supportedNavigationFields.has(field)) {
        console.warn(`Unsupported field \`widgetOptions.navigation.${field}\` in configuration`);
        delete navigation[field as keyof typeof navigation];
      }
    });

    (['arrows', 'dots'] as const).forEach((field) => {
      if (navigation[field] !== undefined && typeof navigation[field] !== 'boolean') {
        throw new TypeError(`\`widgetOptions.navigation.${field}\` must be a boolean`);
      }
    });

    widgetOptions.navigation = navigation;
  }

  private validateStyle(widgetOptions: Partial<CarouselWidgetOptions>): void {
    // a copy, made by validateAndSanitize()
    const style = widgetOptions.style!;

    // a single item per page in the inline modes
    if (widgetOptions.playbackMode !== undefined && widgetOptions.playbackMode !== 'modal') {
      (['columns', 'minItemWidth'] as const).forEach((field) => {
        if (style[field] !== undefined) {
          console.warn(`\`widgetOptions.style.${field}\` is not supported with the "${widgetOptions.playbackMode}" playback mode, a page shows a single item`);
          delete style[field];
        }
      });
    }

    this.listConfigurationService.validateColumns(style.columns);

    if (style.arrows?.position !== undefined && !['overlay', 'outside'].includes(style.arrows.position)) {
      throw new Error('`widgetOptions.style.arrows.position` must be either "overlay" or "outside"');
    }

    if (style.dots?.placement !== undefined && !['bottom', 'top'].includes(style.dots.placement)) {
      throw new Error('`widgetOptions.style.dots.placement` must be either "bottom" or "top"');
    }
  }
}
