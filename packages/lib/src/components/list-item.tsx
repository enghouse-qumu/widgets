import { JSX } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { InfoFieldConfig, InfoSlot, ItemTemplateConfig } from '@/interfaces/item-template-config';
import { useI18n } from '@/i18n';
import { ThumbnailComponent } from '@/components/thumbnail';
import { formatDuration } from '@/utils/presentation-fields';
import { MetadataStyle, renderInfoField } from './info-field';

interface Props {
  // the id of the item, unique in the page; also prefixes the ids referenced by `aria-describedby`
  id: string;
  item: ItemTemplateConfig;
  metadataStyle?: MetadataStyle;
  playIconUrl?: string;
  presentation: Presentation;
  onClick(presentation: Presentation): void;
}

export function ListItemComponent({ id, item, metadataStyle, playIconUrl, presentation, onClick }: Readonly<Props>) {
  const i18n = useI18n();
  // ids of the elements announced as the button's description: the info fields (but the title, already in the name)
  const descriptionIds: string[] = [];

  const renderField = (config: InfoFieldConfig, fieldId: string) => {
    const element = renderInfoField({
      config,
      id: fieldId,
      presentation,
      style: metadataStyle?.[config.field],
    });

    if (element && config.field !== 'title') {
      descriptionIds.push(fieldId);
    }

    return element;
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
