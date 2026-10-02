import { MetadataType, Presentation, PresentationMetadata } from '@/interfaces/presentation';

// Intl.DurationFormat is not part of the TypeScript DOM/ESNext libs yet
type DurationFormatConstructor = new (locale: string, options: Record<string, string>) => {
  format(duration: Record<string, number>): string;
};

export const standardFields = ['title', 'summary', 'publisher', 'publishOn', 'duration'] as const;

export interface ResolvedField {
  // the default label: a translation key for standard fields, the metadata title for metadata fields
  defaultLabel: { key: string } | { text: string };
  // the HTML rendered from the Markdown of a metadata value, safe to insert in the item button
  html?: string;
  // the plain text value, also the text content of `html` when set
  value: string;
}

/**
 * Prepares the HTML of a metadata value, already sanitized by the API, to be rendered in the item `<button>`:
 * links are turned into plain text, as they are not allowed in a button,
 * and a single paragraph is unwrapped so the value stays inline with its label.
 */
export function toItemHtml(html: string): string {
  const template = document.createElement('template');

  template.innerHTML = html.trim();

  const { content } = template;

  content.querySelectorAll('a').forEach((link) => {
    const span = document.createElement('span');

    span.append(...Array.from(link.childNodes));
    link.replaceWith(span);
  });

  const first = content.children.item(0);

  if (content.children.length === 1 && first?.tagName === 'P') {
    first.replaceWith(...Array.from(first.childNodes));
  }

  return template.innerHTML;
}

function textOf(html: string): string {
  const template = document.createElement('template');

  template.innerHTML = html;

  return template.content.textContent?.trim() ?? '';
}

// SELECT values are `{ guid, value }` objects, MULTI_SELECT values arrays of them
function optionValue(option: unknown): string {
  if (option && typeof option === 'object' && 'value' in option) {
    return String((option as { value: unknown }).value);
  }

  return typeof option === 'object' ? '' : String(option as string);
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
  const { DurationFormat } = Intl as unknown as { DurationFormat: DurationFormatConstructor };

  return new DurationFormat(locale, {
    hoursDisplay: 'auto',
    style: 'digital',
  }).format({
    hours,
    minutes,
    seconds,
  });
}

export function formatDate(value: Date | string | number, locale: string, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    locale,
    withTime
      ? {
          dateStyle: 'long',
          timeStyle: 'short',
        }
      : {
          dateStyle: 'long',
        },
  ).format(date);
}

// translates a key, e.g. `I18nService.t`
type Translate = (key: string) => string;

function formatMetadataValue(metadata: PresentationMetadata, locale: string, t: Translate): string {
  const value = metadata.value as unknown;

  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(optionValue).filter(Boolean)
      .join(', ');
  }

  switch (metadata.type) {
    case MetadataType.Boolean:
      // also accept the string values, "false" would be truthy otherwise
      return t(value === true || value === 'true' ? 'list.Yes' : 'list.No');
    case MetadataType.Date:
    case MetadataType.DatePast:
      return formatDate(value as string, locale);
    case MetadataType.DateTime:
      return formatDate(value as string, locale, true);
    case MetadataType.Number:
    case MetadataType.Views:
      return Number.isFinite(Number(value)) ? new Intl.NumberFormat(locale).format(Number(value)) : String(value as string);
    default:
      return optionValue(value);
  }
}

/**
 * Resolves the display value of an info field for a presentation.
 * `field` is either one of the standard fields or a metadata GUID.
 * Returns `null` when the field does not exist or has no value, so it can be skipped when rendering.
 */
export function resolveField(
  presentation: Presentation,
  field: string,
  locale: string,
  t: Translate = (key) => key,
): ResolvedField | null {
  const standard = (value: string | undefined): ResolvedField | null => (value
    ? {
        defaultLabel: {
          key: `list.fields.${field}`,
        },
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
      const metadata = presentation.metadata?.find(({ guid }) => guid === field);

      if (!metadata) {
        return null;
      }

      // the value may contain Markdown, rendered by the API into `html`
      if (metadata.html) {
        const html = toItemHtml(metadata.html);
        const text = textOf(html);

        return text
          ? {
              defaultLabel: { text: metadata.title },
              html,
              value: text,
            }
          : null;
      }

      const value = formatMetadataValue(metadata, locale, t);

      return value
        ? {
            defaultLabel: { text: metadata.title },
            value: decodeEntities(value),
          }
        : null;
    }
  }
}
