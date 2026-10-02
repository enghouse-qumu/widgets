import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatDuration, resolveField, toItemHtml } from '../presentation-fields';
import { MetadataType, Presentation } from '@/interfaces/presentation';

const i18n = vi.hoisted(() => ({
  getLocale: vi.fn(() => 'en-US'),
  t: vi.fn((key: string) => key),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => i18n,
}));

describe('presentation fields', () => {
  beforeEach(() => {
    i18n.getLocale.mockReturnValue('en-US');
    i18n.t.mockClear();
  });

  const presentation: Presentation = {
    duration: 3_723_000,
    metadata: [
      {
        guid: 'md-text',
        title: 'Department',
        type: MetadataType.Text,
        value: 'Sales' as unknown as undefined,
      },
      {
        guid: 'md-tags',
        title: 'Tags',
        type: MetadataType.Tags,
        value: ['a', 'b'] as unknown as undefined,
      },
      {
        guid: 'md-empty',
        title: 'Empty',
        type: MetadataType.Text,
      },
    ],
    published: '2024-03-05T10:00:00Z' as unknown as Date,
    publisher: {
      guid: 'u',
      name: 'Jane Doe',
      username: 'jane',
    },
    summary: 'A short summary',
    title: 'My presentation',
  };

  describe('formatDuration', () => {
    it('should format durations with and without hours', () => {
      expect(formatDuration(3_723_000)).toBe('1:02:03');
      expect(formatDuration(65_000)).toBe('01:05');
      expect(formatDuration(0)).toBe('00:00');
    });
  });

  describe('formatDate', () => {
    it('should format using the locale', () => {
      expect(formatDate('2024-03-05T10:00:00Z')).toBe('March 5, 2024');

      i18n.getLocale.mockReturnValue('fr');

      expect(formatDate('2024-03-05T10:00:00Z')).toBe('5 mars 2024');
    });

    it('should return an empty string for invalid dates', () => {
      expect(formatDate('not a date')).toBe('');
    });
  });

  describe('resolveField', () => {
    it.each([
      ['title', 'My presentation', 'list.fields.title'],
      ['summary', 'A short summary', 'list.fields.summary'],
      ['publisher', 'Jane Doe', 'list.fields.publisher'],
      ['publishOn', 'March 5, 2024', 'list.fields.publishOn'],
      ['duration', '1:02:03', 'list.fields.duration'],
    ])('should resolve the standard field "%s"', (field, value, key) => {
      expect(resolveField(presentation, field)).toEqual({
        defaultLabel: { key },
        value,
      });
    });

    it('should resolve metadata fields by guid', () => {
      const expected = {
        defaultLabel: { text: 'Department' },
        value: 'Sales',
      };

      expect(resolveField(presentation, 'md-text')).toEqual(expected);
      expect(resolveField(presentation, 'md-tags')?.value).toBe('a, b');
    });

    it('should decode the HTML entities returned by the API', () => {
      expect(resolveField({ title: 'Jane&#39;s &amp; <b>Co</b>' }, 'title')?.value).toBe('Jane\'s & <b>Co</b>');
    });

    it('should return null for missing or empty fields', () => {
      expect(resolveField(presentation, 'md-empty')).toBeNull();
      expect(resolveField(presentation, 'unknown')).toBeNull();
      expect(resolveField({}, 'title')).toBeNull();
    });
  });

  describe('toItemHtml', () => {
    it('should unwrap a single paragraph, so the value stays inline with its label', () => {
      expect(toItemHtml('<p>large <strong>text</strong></p>\n')).toBe('large <strong>text</strong>');
    });

    it('should keep the markup of several blocks', () => {
      expect(toItemHtml('<p>one</p>\n<ul><li>two</li></ul>')).toBe('<p>one</p>\n<ul><li>two</li></ul>');
    });

    it('should open the links in a new tab, so the embedding page stays open', () => {
      expect(toItemHtml('<p>see <a href="https://example.com">the docs</a></p>'))
        .toBe('see <a href="https://example.com" target="_blank" rel="noopener noreferrer">the docs</a>');
    });
  });

  describe('metadata values', () => {
    const withMetadata = (metadata: Record<string, unknown>) => ({
      metadata: [
        {
          guid: 'md',
          title: 'Field',
          ...metadata,
        },
      ],
    }) as unknown as Presentation;

    it('should use the html rendered from the Markdown', () => {
      expect(resolveField(withMetadata({
        html: '<p>large <em>text</em></p>\n',
        type: MetadataType.LargeText,
        value: 'large *text*',
      }), 'md')).toEqual({
        defaultLabel: { text: 'Field' },
        html: 'large <em>text</em>',
      });
    });

    it('should skip an empty html value', () => {
      expect(resolveField(withMetadata({
        html: '\n',
        type: MetadataType.LargeText,
        value: ' ',
      }), 'md')).toBeNull();
    });

    it('should use the option values of select fields', () => {
      expect(resolveField(withMetadata({
        type: MetadataType.Select,
        value: {
          guid: 'o1',
          value: 'Option 1',
        },
      }), 'md')?.value).toBe('Option 1');
      expect(resolveField(withMetadata({
        type: MetadataType.MultiSelect,
        value: [
          {
            guid: 'o2',
            value: 'Option 2',
          },
          {
            guid: 'o1',
            value: 'Option 1',
          },
        ],
      }), 'md')?.value).toBe('Option 2, Option 1');
    });

    it.each([
      [true, 'list.Yes'],
      [false, 'list.No'],
      ['true', 'list.Yes'],
      ['false', 'list.No'],
    ])('should translate the boolean value %s', (value, expected) => {
      expect(resolveField(withMetadata({
        type: MetadataType.Boolean,
        value,
      }), 'md')?.value).toBe(expected);
      expect(i18n.t).toHaveBeenCalledWith(expected);
    });

    it('should decode the HTML entities of plain values', () => {
      expect(resolveField(withMetadata({
        type: MetadataType.Text,
        value: 'Q&amp;A',
      }), 'md')?.value).toBe('Q&A');
    });
  });
});
