import { ComponentChildren, JSX } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { InfoFieldConfig } from '@/interfaces/item-template-config';
import { ListWidgetStyle } from '@/interfaces/list-widget-style';
import { useI18n } from '@/i18n';
import { resolveField } from '@/utils/presentation-fields';

// fields showing their label only when `label` is set explicitly, all the others show it by default
const unlabelledFields = new Set(['title', 'summary']);

export type MetadataStyle = NonNullable<NonNullable<ListWidgetStyle['item']>['metadata']>;

interface Options {
  config: InfoFieldConfig;
  // the id of the field, referenced by `aria-describedby`
  id: string;
  presentation: Presentation;
  style?: MetadataStyle[string];
  // replaces the resolved value, e.g. the watched time of the playlist items
  value?: ComponentChildren;
}

/**
 * Converts the per-field style into the private custom properties read by `.qc-list-item__field`
 */
export function getFieldStyle(style: MetadataStyle[string] | undefined): JSX.CSSProperties | undefined {
  if (!style) {
    return undefined;
  }

  const properties: Record<string, string> = {};
  const map: Record<keyof typeof style, string> = {
    color: '--qc-lw-field-color',
    fontFamily: '--qc-lw-field-font-family',
    fontSize: '--qc-lw-field-font-size',
    fontWeight: '--qc-lw-field-font-weight',
    hoverColor: '--qc-lw-field-hover-color',
    hoverLabelColor: '--qc-lw-field-hover-label-color',
    labelColor: '--qc-lw-field-label-color',
    letterSpacing: '--qc-lw-field-letter-spacing',
    lineClamp: '--qc-lw-field-line-clamp',
    padding: '--qc-lw-field-padding',
    textTransform: '--qc-lw-field-text-transform',
  };

  Object.entries(style).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key in map) {
      properties[map[key as keyof typeof style]] = String(value);
    }
  });

  return properties;
}

/**
 * Renders an info field of an item, as a group of a description list: its label and its value.
 * Returns `null` when the presentation has no value for the field, so it is skipped.
 * Shared by the items of the List and Playlist widgets.
 */
export function renderInfoField({ config: { field, label }, id, presentation, style, value }: Options): JSX.Element | null {
  const i18n = useI18n();
  const resolved = resolveField(presentation, field);

  if (!resolved) {
    return null;
  }

  const defaultLabel = 'key' in resolved.defaultLabel ? i18n.t(resolved.defaultLabel.key) : resolved.defaultLabel.text;
  // a hidden label is still rendered for the screen readers, each value of the description list needs its term
  const showLabel = typeof label === 'string' || (label ?? !unlabelledFields.has(field));

  // a group of the description list, `<dt>` and `<dd>` are displayed inline
  return (
    <div
      key={id}
      id={id}
      class={style?.lineClamp ? 'qc-list-item__field qc-list-item__field--clamp' : 'qc-list-item__field'}
      data-field={field}
      style={getFieldStyle(style)}
    >
      <dt class={showLabel ? 'qc-list-item__label' : 'qc-list-item__label qc-sr-only'}>
        {typeof label === 'string' ? label : defaultLabel}
      </dt>
      {/* the space between the term and the value, also kept in the accessible description */}
      {' '}
      {resolved.html && value === undefined ? (
        // sanitized by the API, prepared by toItemHtml()
        <dd class="qc-list-item__value qc-list-item__value--html" dangerouslySetInnerHTML={{ __html: resolved.html }}/>
      ) : (
        <dd class="qc-list-item__value">{value ?? resolved.value}</dd>
      )}
    </div>
  );
}
