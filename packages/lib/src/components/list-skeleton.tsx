import { InfoSlot, ItemTemplateConfig } from '@/interfaces/item-template-config';
import { useI18n } from '@/i18n';
import { getFieldStyle, MetadataStyle } from './list-item';

interface Props {
  count: number;
  item: ItemTemplateConfig;
  layout: 'grid' | 'vertical';
  metadataStyle?: MetadataStyle;
}

/**
 * The "ghost" items shown while the presentations are loading. They use the classes of the real items, so they follow
 * the layout and the item styling (padding, border, thumbnail size…) and the page does not jump when the data arrives.
 */
export function ListSkeletonComponent({ count, item, layout, metadataStyle }: Readonly<Props>) {
  const i18n = useI18n();

  // a line per configured field, the title thicker. Each line is inside a field with its style,
  // so it gets the same spacing (padding) as the real field, and its height follows the font size
  const renderSlot = (slot: InfoSlot) => {
    const fields = item.info[slot];

    if (!fields?.length) {
      return null;
    }

    return (
      <div class={`qc-list-item__info qc-list-item__info--${slot}`}>
        {fields.map(({ field }, index) => (
          <div key={index} class="qc-list-item__field" data-field={field} style={getFieldStyle(metadataStyle?.[field])}>
            {/* as many lines as the field is clamped to */}
            {Array.from({ length: metadataStyle?.[field]?.lineClamp ?? 1 }, (_, line) => (
              <span
                key={line}
                class={field === 'title' ? 'qc-list-skeleton__line qc-list-skeleton__line--title' : 'qc-list-skeleton__line'}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div class="qc-list-skeleton">
      <span class="qc-sr-only" role="status">{i18n.t('list.Loading presentations')}</span>
      <ul class={`qc-list qc-list--${layout}`} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li class="qc-list__item" key={index}>
            <div class="qc-list-item qc-list-item--skeleton">
              {renderSlot('top')}
              <div class="qc-list-item__body">
                {renderSlot('left')}
                <span class="qc-thumbnail qc-list-skeleton__thumbnail"/>
                {renderSlot('right')}
              </div>
              {renderSlot('bottom')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
