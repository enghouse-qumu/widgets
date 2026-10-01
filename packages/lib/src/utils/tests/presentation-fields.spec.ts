import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, resolveField } from '../presentation-fields';
import { MetadataType, Presentation } from '@/interfaces/presentation';

describe('presentation fields', () => {
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
      expect(formatDuration(3_723_000, 'en')).toBe('1:02:03');
      expect(formatDuration(65_000, 'en')).toBe('01:05');
      expect(formatDuration(0, 'en')).toBe('00:00');
    });

    it('should fall back to a manual format when Intl.DurationFormat is not supported', () => {
      const intl = Intl as unknown as Record<string, unknown>;
      const { DurationFormat } = intl;

      delete intl.DurationFormat;

      try {
        expect(formatDuration(3_723_000, 'en')).toBe('1:02:03');
        expect(formatDuration(65_000, 'en')).toBe('01:05');
      } finally {
        intl.DurationFormat = DurationFormat;
      }
    });
  });

  describe('formatDate', () => {
    it('should format using the locale', () => {
      expect(formatDate('2024-03-05T10:00:00Z', 'en-US')).toBe('March 5, 2024');
      expect(formatDate('2024-03-05T10:00:00Z', 'fr')).toBe('5 mars 2024');
    });

    it('should return an empty string for invalid dates', () => {
      expect(formatDate('not a date', 'en')).toBe('');
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
      expect(resolveField(presentation, field, 'en-US')).toEqual({
        defaultLabel: { key },
        value,
      });
    });

    it('should resolve metadata fields by guid, with or without the md: prefix', () => {
      const expected = {
        defaultLabel: { text: 'Department' },
        value: 'Sales',
      };

      expect(resolveField(presentation, 'md-text', 'en')).toEqual(expected);
      expect(resolveField(presentation, 'md:md-text', 'en')).toEqual(expected);
      expect(resolveField(presentation, 'md-tags', 'en')?.value).toBe('a, b');
    });

    it('should decode the HTML entities returned by the API', () => {
      expect(resolveField({ title: 'Jane&#39;s &amp; <b>Co</b>' }, 'title', 'en')?.value).toBe('Jane\'s & <b>Co</b>');
    });

    it('should return null for missing or empty fields', () => {
      expect(resolveField(presentation, 'md-empty', 'en')).toBeNull();
      expect(resolveField(presentation, 'unknown', 'en')).toBeNull();
      expect(resolveField({}, 'title', 'en')).toBeNull();
    });
  });
});
