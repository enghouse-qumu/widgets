import { ListWidgetConfiguration, ListWidgetOptions } from '@/interfaces/list-widget';
import { ListWidgetSource, ListWidgetSourceBase } from '@/interfaces/list-widget-source';
import { SearchFilter } from '@/interfaces/search-filter';
import { InfoFieldConfig, InfoSlot, ItemTemplateConfig } from '@/interfaces/item-template-config';
import { ConfigurationService } from '@/services/configuration.service';

const supportedConfigFields = new Set([
  'selector',
  'source',
  'locales',
  'widgetOptions',
  'playerParameters',
]);
const supportedSourceFields = new Set([
  'host',
  'limit',
  'offset',
  'presentationGuids',
  'smartSearch',
  'smartSearchGuid',
  'sortBy',
  'sortOrder',
]);
const supportedWidgetFields = new Set([
  'item',
  'layout',
  'playIconUrl',
  'style',
  'onIframeLoad',
  'onItemClick',
]);
const infoSlots: InfoSlot[] = ['top', 'left', 'right', 'bottom'];
const searchComparators = new Set([
  'is',
  'is_not',
  'contains',
  'does_not_contain',
  'contains_any',
  'less_than',
  'greater_than',
  'greater_than_or_equal_to',
  'less_than_or_equal_to',
  'between',
  'not_between',
  'in_the_last',
  'not_in_the_last',
  'in_the_next',
  'not_in_the_next',
]);

// the source as given by the embedding page, before its validation
type UncheckedSource = ListWidgetSourceBase & Partial<{
  presentationGuids: string[];
  smartSearch: SearchFilter;
  smartSearchGuid: string;
  sortBy: string;
  sortOrder: 'ASCENDING' | 'DESCENDING';
}>;

export const layoutDefaults: Record<ListWidgetOptions['layout'], { info: ItemTemplateConfig['info'];
  limit: number; }> = {
  grid: {
    info: {
      bottom: [
        { field: 'title' },
        { field: 'publishOn' },
      ],
    },
    limit: 12,
  },
  vertical: {
    info: {
      right: [
        { field: 'title' },
        { field: 'summary' },
        { field: 'publisher' },
      ],
    },
    limit: 10,
  },
};

export interface ResolvedListWidgetConfiguration extends ListWidgetConfiguration {
  widgetOptions: Partial<ListWidgetOptions> & Pick<ListWidgetOptions, 'layout' | 'item' | 'style'> & {
    item: ItemTemplateConfig;
  };
}

export class ListConfigurationService {
  private readonly configurationService = new ConfigurationService();

  createConfiguration(initialConfiguration: ListWidgetConfiguration): ResolvedListWidgetConfiguration {
    const configuration = this.validateAndSanitize(initialConfiguration);
    const layout = configuration.widgetOptions?.layout ?? 'grid';
    const defaults = layoutDefaults[layout];

    return {
      ...configuration,
      playerParameters: { ...configuration.playerParameters },
      source: {
        ...configuration.source,
        host: configuration.source.host
          .replace('https://', '')
          .split('/')[0],
        // all the listed presentations are shown by default, the layout default applies to the other sources
        limit: configuration.source.limit
          ?? ('presentationGuids' in configuration.source ? configuration.source.presentationGuids.length : defaults.limit),
      },
      widgetOptions: {
        ...configuration.widgetOptions,
        item: {
          // a provided `info` replaces the layout defaults entirely, so fields can also be removed
          info: configuration.widgetOptions?.item?.info ?? defaults.info,
          showDurationOverlay: configuration.widgetOptions?.item?.showDurationOverlay ?? true,
        },
        layout,
        style: { ...configuration.widgetOptions?.style },
      },
    };
  }

  private validateAndSanitize(initialConfiguration: ListWidgetConfiguration): ListWidgetConfiguration {
    if (!initialConfiguration || typeof initialConfiguration !== 'object') {
      throw new Error('Configuration must be a valid object');
    }

    ['selector', 'source'].forEach((field) => {
      if (!Object.hasOwn(initialConfiguration, field)) {
        throw new Error(`\`${field}\` is not defined in the configuration`);
      }
    });

    const { selector } = initialConfiguration;

    if (!(selector instanceof HTMLElement)) {
      if (typeof selector !== 'string') {
        throw new TypeError('`selector` must be a string or an instance of HTMLElement');
      }

      if (selector.trim() === '') {
        throw new Error('`selector` cannot be an empty string');
      }
    }

    if (!initialConfiguration.source || typeof initialConfiguration.source !== 'object') {
      throw new TypeError('`source` must be a valid object');
    }

    const configuration: ListWidgetConfiguration = {
      ...initialConfiguration,
      playerParameters: { ...initialConfiguration.playerParameters },
      source: { ...initialConfiguration.source } as ListWidgetSource,
      widgetOptions: { ...initialConfiguration.widgetOptions },
    };

    Object.keys(configuration).forEach((field) => {
      if (!supportedConfigFields.has(field)) {
        console.warn(`Unsupported field \`${field}\` in configuration`);
        delete configuration[field as keyof ListWidgetConfiguration];
      }
    });

    this.validateSource(configuration.source);
    this.configurationService.validatePlayerParameters(configuration.playerParameters);
    this.validateWidgetOptions(configuration.widgetOptions!);

    return configuration;
  }

  private validateSource(validatedSource: ListWidgetSource): void {
    // the configuration is not trusted: every property is checked, including the combinations the type does not allow
    const source = validatedSource as UncheckedSource;

    Object.keys(source).forEach((field) => {
      if (!supportedSourceFields.has(field)) {
        console.warn(`Unsupported field \`source.${field}\` in configuration`);
        delete source[field as keyof ListWidgetSource];
      }
    });

    if (typeof source.host !== 'string' || source.host.trim() === '') {
      throw new TypeError('`source.host` must be a non-empty string');
    }

    try {
      // eslint-disable-next-line no-new
      new URL(`https://${source.host.replace('https://', '')}`);
    } catch {
      throw new Error('`source.host` must be a valid domain name');
    }

    const dataSources = (['smartSearchGuid', 'presentationGuids', 'smartSearch'] as const)
      .filter((field) => source[field] !== undefined);

    if (dataSources.length !== 1) {
      throw new Error('`source` must define exactly one of `smartSearchGuid`, `presentationGuids` or `smartSearch`');
    }

    if (source.smartSearchGuid !== undefined && (typeof source.smartSearchGuid !== 'string' || source.smartSearchGuid.trim() === '')) {
      throw new TypeError('`source.smartSearchGuid` must be a non-empty string');
    }

    if (source.presentationGuids !== undefined) {
      // the presentations are rendered in the given order
      (['sortBy', 'sortOrder'] as const).forEach((field) => {
        if (field in source) {
          console.warn(`\`source.${field}\` is not supported with \`source.presentationGuids\`, the presentations keep the given order`);
          delete (source as Partial<Record<typeof field, unknown>>)[field];
        }
      });

      if (!Array.isArray(source.presentationGuids) || source.presentationGuids.length === 0) {
        throw new TypeError('`source.presentationGuids` must be a non-empty array of strings');
      }

      if (source.presentationGuids.some((guid) => typeof guid !== 'string' || guid.trim() === '')) {
        throw new TypeError('`source.presentationGuids` must only contain non-empty strings');
      }
    }

    if (source.smartSearch !== undefined) {
      const { match, rules } = source.smartSearch;

      if (!['any', 'all'].includes(match)) {
        throw new Error('`source.smartSearch.match` must be either "any" or "all"');
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        throw new TypeError('`source.smartSearch.rules` must be a non-empty array');
      }

      rules.forEach((rule, index) => {
        if (typeof rule?.field !== 'string' || rule.field.trim() === '') {
          throw new TypeError(`\`source.smartSearch.rules[${index}].field\` must be a non-empty string`);
        }

        if (!searchComparators.has(rule.comparator)) {
          throw new Error(`\`source.smartSearch.rules[${index}].comparator\` is not a supported comparator`);
        }

        if (typeof rule.value !== 'string') {
          throw new TypeError(`\`source.smartSearch.rules[${index}].value\` must be a string`);
        }
      });
    }

    (['limit', 'offset'] as const).forEach((field) => {
      const value = source[field];

      if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        throw new Error(`\`source.${field}\` must be a non-negative integer`);
      }
    });

    if (source.sortBy !== undefined && (typeof source.sortBy !== 'string' || source.sortBy.trim() === '')) {
      throw new TypeError('`source.sortBy` must be a non-empty string');
    }

    if (source.sortOrder !== undefined && !['ASCENDING', 'DESCENDING'].includes(source.sortOrder)) {
      throw new Error('`source.sortOrder` must be either "ASCENDING" or "DESCENDING"');
    }
  }

  private validateWidgetOptions(widgetOptions: Partial<ListWidgetOptions>): void {
    Object.keys(widgetOptions).forEach((field) => {
      if (!supportedWidgetFields.has(field)) {
        console.warn(`Unsupported field \`widgetOptions.${field}\` in configuration`);
        delete widgetOptions[field as keyof typeof widgetOptions];
      }
    });

    if (widgetOptions.layout !== undefined && !['grid', 'vertical'].includes(widgetOptions.layout)) {
      throw new Error('`widgetOptions.layout` must be either "grid" or "vertical"');
    }

    (['onIframeLoad', 'onItemClick'] as const).forEach((field) => {
      if (widgetOptions[field] !== undefined && typeof widgetOptions[field] !== 'function') {
        throw new TypeError(`\`widgetOptions.${field}\` must be a function`);
      }
    });

    const columns = widgetOptions.style?.columns;

    if (columns !== undefined && columns !== 'auto' && (!Number.isInteger(columns) || columns < 1)) {
      throw new Error('`widgetOptions.style.columns` must be either "auto" or a positive integer');
    }

    const info = widgetOptions.item?.info;

    if (info === undefined) {
      return;
    }

    if (!info || typeof info !== 'object') {
      throw new TypeError('`widgetOptions.item.info` must be an object');
    }

    Object.entries(info).forEach(([slot, fields]) => {
      if (!infoSlots.includes(slot as InfoSlot)) {
        throw new Error(`\`widgetOptions.item.info.${slot}\` is not a supported slot, use "top", "left", "right" or "bottom"`);
      }

      if (!Array.isArray(fields)) {
        throw new TypeError(`\`widgetOptions.item.info.${slot}\` must be an array`);
      }

      fields.forEach((fieldConfig: InfoFieldConfig, index) => {
        if (typeof fieldConfig?.field !== 'string' || fieldConfig.field.trim() === '') {
          throw new TypeError(`\`widgetOptions.item.info.${slot}[${index}].field\` must be a non-empty string`);
        }

        if (fieldConfig.label !== undefined && !['string', 'boolean'].includes(typeof fieldConfig.label)) {
          throw new TypeError(`\`widgetOptions.item.info.${slot}[${index}].label\` must be a string or a boolean`);
        }
      });
    });
  }
}
