import { MetadataType, Presentation, PresentationMetadata } from '@/interfaces/presentation';

// Intl.DurationFormat is not part of the TypeScript DOM/ESNext libs yet
type DurationFormatConstructor = new (locale: string, options: Record<string, string>) => {
  format(duration: Record<string, number>): string;
};

export const standardFields = ['title', 'summary', 'publisher', 'publishOn', 'duration'] as const;

export interface ResolvedField {
  // the default label: a translation key for standard fields, the metadata title for metadata fields
  defaultLabel: { key: string } | { text: string };
  value: string;
}

/**
 * Decodes the HTML entities of a text value, the API returns some fields encoded (e.g. `&#39;` in titles)
 */
export function decodeEntities(value: string): string {
  if (!value.includes('&')) {
    return value;
  }

  // a textarea only decodes the entities, markup-like text is kept as-is
  const textarea = document.createElement('textarea');

  textarea.innerHTML = value;

  return textarea.value;
}

/**
 * Splits a duration expressed in milliseconds into hours, minutes and seconds
 */
function toDurationParts(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Formats a duration (in milliseconds) as a locale-aware digital clock value, e.g. "1:02:03" or "04:05"
 */
export function formatDuration(durationMs: number, locale: string): string {
  const { hours, minutes, seconds } = toDurationParts(durationMs);
  const { DurationFormat } = Intl as unknown as { DurationFormat?: DurationFormatConstructor };

  if (DurationFormat) {
    try {
      return new DurationFormat(locale, {
        hoursDisplay: 'auto',
        style: 'digital',
      }).format({
        hours,
        minutes,
        seconds,
      });
    } catch {
      // fall through to the manual formatting for unsupported locales
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDate(value: Date | string | number, locale: string, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(locale, withTime
      ? { dateStyle: 'long',
          timeStyle: 'short' }
      : { dateStyle: 'long' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function formatMetadataValue(metadata: PresentationMetadata, locale: string): string {
  const value = metadata.value as unknown;

  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  switch (metadata.type) {
    case MetadataType.Date:
    case MetadataType.DatePast:
      return formatDate(value as string, locale);
    case MetadataType.DateTime:
      return formatDate(value as string, locale, true);
    case MetadataType.Number:
    case MetadataType.Views:
      return Number.isFinite(Number(value)) ? new Intl.NumberFormat(locale).format(Number(value)) : String(value as string);
    default:
      return typeof value === 'object' ? '' : String(value as string);
  }
}

/**
 * Resolves the display value of an info field for a presentation.
 * `field` is either one of the standard fields or a metadata GUID (optionally prefixed with `md:`).
 * Returns `null` when the field does not exist or has no value, so it can be skipped when rendering.
 */
export function resolveField(presentation: Presentation, field: string, locale: string): ResolvedField | null {
  const standard = (value: string | undefined): ResolvedField | null => (value
    ? {
        defaultLabel: { key: `list.fields.${field}` },
        value: decodeEntities(value),
      }
    : null);

  switch (field) {
    case 'title':
      return standard(presentation.title);
    case 'summary':
      return standard(presentation.summary);
    case 'publisher':
      return standard(presentation.publisher?.name);
    case 'publishOn':
      return standard(presentation.published ? formatDate(presentation.published, locale) : undefined);
    case 'duration':
      return standard(presentation.duration ? formatDuration(presentation.duration, locale) : undefined);

    default: {
      const guid = field.replace(/^md:/, '');
      const metadata = presentation.metadata?.find((md) => md.guid === guid);
      const value = metadata ? formatMetadataValue(metadata, locale) : '';

      return value
        ? { defaultLabel: { text: metadata!.title },
            value }
        : null;
    }
  }
}
