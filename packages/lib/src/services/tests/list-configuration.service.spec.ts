import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ListConfigurationService } from '../list-configuration.service';
import { ListWidgetConfiguration } from '@/interfaces/list-widget';

describe('ListConfigurationService', () => {
  const service = new ListConfigurationService();

  const baseConfiguration: ListWidgetConfiguration = {
    selector: '#widget',
    source: {
      host: 'https://example.com/some/path',
      smartSearchGuid: 'playlist-guid',
    },
  };

  const create = (configuration: unknown) => service.createConfiguration(configuration as ListWidgetConfiguration);

  beforeEach(() => {
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('defaults', () => {
    it('should apply the grid layout defaults', () => {
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
        layout: 'grid',
        style: {},
      });
    });

    it('should apply the vertical layout defaults', () => {
      const configuration = create({
        ...baseConfiguration,
        widgetOptions: { layout: 'vertical' },
      });

      expect(configuration.source.limit).toBe(10);
      expect(configuration.widgetOptions.item.info).toEqual({
        right: [
          { field: 'title' },
          { field: 'summary' },
          { field: 'publisher' },
        ],
      });
    });

    it('should keep explicit values over the layout defaults', () => {
      const configuration = create({
        ...baseConfiguration,
        source: {
          ...baseConfiguration.source,
          limit: 3,
        },
        widgetOptions: {
          item: {
            info: { top: [{ field: 'publisher' }] },
            showDurationOverlay: true,
          },
        },
      });

      expect(configuration.source.limit).toBe(3);
      expect(configuration.widgetOptions.item).toEqual({
        info: { top: [{ field: 'publisher' }] },
        showDurationOverlay: true,
      });
    });

    it('should show all the presentation guids by default', () => {
      const guids = Array.from({ length: 15 }, (_, i) => `guid-${i}`);
      const source = {
        host: 'example.com',
        presentationGuids: guids,
      };

      expect(create({
        ...baseConfiguration,
        source,
      }).source.limit).toBe(15);
      expect(create({
        ...baseConfiguration,
        source: {
          ...source,
          limit: 5,
        },
      }).source.limit).toBe(5);
    });

    it('should drop the sort of presentation guids with a warning, they keep the given order', () => {
      const configuration = create({
        ...baseConfiguration,
        source: {
          host: 'example.com',
          presentationGuids: ['b', 'a'],
          sortBy: 'title',
          sortOrder: 'ASCENDING',
        },
      });

      expect(configuration.source).not.toHaveProperty('sortBy');
      expect(configuration.source).not.toHaveProperty('sortOrder');
      expect(console.warn).toHaveBeenCalledWith('`source.sortBy` is not supported with `source.presentationGuids`, the presentations keep the given order');
    });

    it('should allow disabling the duration overlay', () => {
      const configuration = create({
        ...baseConfiguration,
        widgetOptions: { item: { showDurationOverlay: false } },
      });

      expect(configuration.widgetOptions.item.showDurationOverlay).toBe(false);
    });

    it('should not mutate the input configuration', () => {
      const input = structuredClone(baseConfiguration);

      create(input);

      expect(input).toEqual(baseConfiguration);
    });
  });

  describe('validation', () => {
    it.each([
      [null, 'Configuration must be a valid object'],
      [{ source: baseConfiguration.source }, '`selector` is not defined in the configuration'],
      [{ selector: '#widget' }, '`source` is not defined in the configuration'],
      [{ ...baseConfiguration,
        selector: '  ' }, '`selector` cannot be an empty string'],
      [{ ...baseConfiguration,
        selector: 1 }, '`selector` must be a string or an instance of HTMLElement'],
      [{ ...baseConfiguration,
        source: null }, '`source` must be a valid object'],
      [{ ...baseConfiguration,
        source: { smartSearchGuid: 'a' } }, '`source.host` must be a non-empty string'],
      [{ ...baseConfiguration,
        source: { host: 'exa mple.com',
          smartSearchGuid: 'a' } }, '`source.host` must be a valid domain name'],
    ])('should reject invalid configuration %#', (configuration, message) => {
      expect(() => create(configuration)).toThrow(message);
    });

    it.each([
      [{}],
      [{ presentationGuids: ['a'],
        smartSearchGuid: 'a' }],
      [{ smartSearch: { match: 'any',
        rules: [] },
      smartSearchGuid: 'a' }],
    ])('should require exactly one data source %#', (dataSource) => {
      expect(() => create({
        ...baseConfiguration,
        source: {
          host: 'example.com',
          ...dataSource,
        },
      })).toThrow('`source` must define exactly one of `smartSearchGuid`, `presentationGuids` or `smartSearch`');
    });

    it.each([
      [{ smartSearchGuid: ' ' }, '`source.smartSearchGuid` must be a non-empty string'],
      [{ presentationGuids: [] }, '`source.presentationGuids` must be a non-empty array of strings'],
      [{ presentationGuids: ['a', ''] }, '`source.presentationGuids` must only contain non-empty strings'],
      [{ smartSearch: { match: 'some',
        rules: [] } }, '`source.smartSearch.match` must be either "any" or "all"'],
      [{ smartSearch: { match: 'any',
        rules: [] } }, '`source.smartSearch.rules` must be a non-empty array'],
      [{ smartSearch: { match: 'any',
        rules: [{ comparator: 'is',
          value: 'x' }] } }, '`source.smartSearch.rules[0].field` must be a non-empty string'],
      [{ smartSearch: { match: 'any',
        rules: [{ comparator: 'like',
          field: 'title',
          value: 'x' }] } }, '`source.smartSearch.rules[0].comparator` is not a supported comparator'],
      [{ smartSearch: { match: 'any',
        rules: [{ comparator: 'is',
          field: 'title',
          value: 1 }] } }, '`source.smartSearch.rules[0].value` must be a string'],
      [{ limit: -1,
        smartSearchGuid: 'a' }, '`source.limit` must be a non-negative integer'],
      [{ offset: 1.5,
        smartSearchGuid: 'a' }, '`source.offset` must be a non-negative integer'],
      [{ smartSearchGuid: 'a',
        sortBy: '' }, '`source.sortBy` must be a non-empty string'],
      [{ smartSearchGuid: 'a',
        sortOrder: 'UP' }, '`source.sortOrder` must be either "ASCENDING" or "DESCENDING"'],
    ])('should validate the source %#', (source, message) => {
      expect(() => create({
        ...baseConfiguration,
        source: {
          host: 'example.com',
          ...source,
        },
      })).toThrow(message);
    });

    it.each([
      [{ layout: 'carousel' }, '`widgetOptions.layout` must be either "grid" or "vertical"'],
      [{ onItemClick: 'nope' }, '`widgetOptions.onItemClick` must be a function'],
      [{ onIframeLoad: 1 }, '`widgetOptions.onIframeLoad` must be a function'],
      [{ style: { columns: 0 } }, '`widgetOptions.style.columns` must be either "auto" or a positive integer'],
      [{ item: { info: { over: [] } } }, '`widgetOptions.item.info.over` is not a supported slot'],
      [{ item: { info: { top: 'title' } } }, '`widgetOptions.item.info.top` must be an array'],
      [{ item: { info: { top: [{}] } } }, '`widgetOptions.item.info.top[0].field` must be a non-empty string'],
      [{ item: { info: { top: [{ field: 'title',
        label: 1 }] } } }, '`widgetOptions.item.info.top[0].label` must be a string or a boolean'],
    ])('should validate the widget options %#', (widgetOptions, message) => {
      expect(() => create({
        ...baseConfiguration,
        widgetOptions,
      })).toThrow(message);
    });

    it('should drop unsupported fields with a warning', () => {
      const configuration = create({
        ...baseConfiguration,
        guid: 'legacy',
        source: {
          ...baseConfiguration.source,
          useUserAuth: true,
        },
        widgetOptions: { playbackMode: 'inline' },
      });

      expect(configuration).not.toHaveProperty('guid');
      expect(configuration.source).not.toHaveProperty('useUserAuth');
      expect(configuration.widgetOptions).not.toHaveProperty('playbackMode');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `guid` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `source.useUserAuth` in configuration');
      expect(console.warn).toHaveBeenCalledWith('Unsupported field `widgetOptions.playbackMode` in configuration');
    });

    it('should validate the player parameters', () => {
      expect(() => create({
        ...baseConfiguration,
        playerParameters: { pv: 'nope' },
      })).toThrow('`playerParameters.pv` must be either "pipls", "pipss" or "sbs"');
    });
  });
});
