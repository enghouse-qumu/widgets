import { JSX } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { InfoFieldConfig, InfoSlot, ItemTemplateConfig } from '@/interfaces/item-template-config';
import { ListWidgetStyle } from '@/interfaces/list-widget-style';
import { useI18n } from '@/i18n';
import { ThumbnailComponent } from '@/components/thumbnail';
import { formatDuration, resolveField } from '@/utils/presentation-fields';

// fields showing their label only when `label` is set explicitly, all the others show it by default
const unlabelledFields = new Set(['title', 'summary']);

type MetadataStyle = NonNullable<NonNullable<ListWidgetStyle['item']>['metadata']>;

interface Props {
  // the id of the item, unique in the page; also prefixes the ids referenced by `aria-describedby`
  id: string;
  item: ItemTemplateConfig;
  metadataStyle?: MetadataStyle;
  playIconUrl?: string;
  presentation: Presentation;
  onClick(presentation: Presentation): void;
}

/**
 * Converts the per-field style into the private custom properties read by `.qc-list-item__field`
 */
function getFieldStyle(style: MetadataStyle[string] | undefined): JSX.CSSProperties | undefined {
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

export function ListItemComponent({ id, item, metadataStyle, playIconUrl, presentation, onClick }: Readonly<Props>) {
  const i18n = useI18n();
  // ids of the elements announced as the button's description: the info fields (but the title, already in the name)
  const descriptionIds: string[] = [];

  const renderField = ({ field, label }: InfoFieldConfig, fieldId: string) => {
    const resolved = resolveField(presentation, field);
    const fieldStyle = metadataStyle?.[field];

    if (!resolved) {
      return null;
    }

    const defaultLabel = 'key' in resolved.defaultLabel ? i18n.t(resolved.defaultLabel.key) : resolved.defaultLabel.text;
    // a hidden label is still rendered for the screen readers, each value of the description list needs its term
    const showLabel = typeof label === 'string' || (label ?? !unlabelledFields.has(field));

    if (field !== 'title') {
      descriptionIds.push(fieldId);
    }

    // a group of the description list, `<dt>` and `<dd>` are displayed inline
    return (
      <div
        key={fieldId}
        id={fieldId}
        class={fieldStyle?.lineClamp ? 'qc-list-item__field qc-list-item__field--clamp' : 'qc-list-item__field'}
        data-field={field}
        style={getFieldStyle(fieldStyle)}
      >
        <dt class={showLabel ? 'qc-list-item__label' : 'qc-list-item__label qc-sr-only'}>
          {typeof label === 'string' ? label : defaultLabel}
        </dt>
        {/* the space between the term and the value, also kept in the accessible description */}
        {' '}
        {resolved.html ? (
          // sanitized by the API, prepared by toItemHtml()
          <dd class="qc-list-item__value qc-list-item__value--html" dangerouslySetInnerHTML={{ __html: resolved.html }}/>
        ) : (
          <dd class="qc-list-item__value">{resolved.value}</dd>
        )}
      </div>
    );
  };

  const renderSlot = (slot: InfoSlot) => {
    const fields = item.info[slot];

    if (!fields?.length) {
      return null;
    }

    return (
      <dl class={`qc-list-item__info qc-list-item__info--${slot}`}>
        {fields.map((fieldConfig, index) => renderField(fieldConfig, `${id}-${slot}-${index}`))}
      </dl>
    );
  };

  // the slots are rendered first, in the visual order, to collect the description ids before rendering the button
  const topSlot = renderSlot('top');
  const leftSlot = renderSlot('left');
  const rightSlot = renderSlot('right');
  const bottomSlot = renderSlot('bottom');

  const duration = item.showDurationOverlay && presentation.duration
    ? formatDuration(presentation.duration)
    : null;
  // the badge is only visual, the duration is announced in the description when it is not an info field already
  const durationDescriptionId = `${id}-duration`;
  const describeDuration = !!duration && !Object.values(item.info).some((fields) => fields?.some(({ field }) => field === 'duration'));

  if (describeDuration) {
    descriptionIds.push(durationDescriptionId);
  }

  // The card opens the player on click, except when the user selects its text (e.g. to copy it) or clicks a link.
  // The thumbnail is the actual button, for the keyboard and the screen readers.
  const handleClick = (event: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    // links open their own target
    if ((event.target as Element).closest('a')) {
      return;
    }

    const selection = globalThis.getSelection?.();

    // `detail` is 0 for a keyboard activation of the button, which always plays
    if (event.detail > 0 && selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) {
      return;
    }

    onClick(presentation);
  };

  return (
    <div id={id} class="qc-list-item" onClick={handleClick}>
      {topSlot}
      <div class="qc-list-item__body">
        {leftSlot}
        {/* named with the play text, which contains the visible title; the other fields are the description.
            Its click is handled by the item */}
        <ThumbnailComponent
          describedBy={descriptionIds.length ? descriptionIds.join(' ') : undefined}
          loading="lazy"
          presentation={presentation}
          widgetOptions={{ playIconUrl }}
        >
          {duration && (
            <span class="qc-list-item__duration" aria-hidden="true">
              {duration}
            </span>
          )}
        </ThumbnailComponent>
        {rightSlot}
      </div>
      {bottomSlot}
      {describeDuration && (
        <span id={durationDescriptionId} class="qc-sr-only">{`${i18n.t('list.fields.duration')} ${duration}`}</span>
      )}
    </div>
  );
}
