import { ComponentChildren } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { WidgetOptions } from '@/interfaces/widget-options';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { decodeEntities } from '@/utils/presentation-fields';

interface Props {
  // the BEM block of the image and the play icon, e.g. `qc-list-item` renders `qc-list-item__image`
  block?: string;
  // e.g. the duration badge of the list widget
  children?: ComponentChildren;
  // the class of the button
  class?: string;
  // the ids of the elements describing the button
  describedBy?: string;
  loading?: 'eager' | 'lazy';
  // when omitted, the click is left to the parent, e.g. the list widget item
  onClick?: () => void;
  presentation: Presentation;
  widgetOptions: Partial<Pick<WidgetOptions, 'onThumbnailClick' | 'playIconUrl'>>;
}

/**
 * The play button of a presentation: its thumbnail and a play icon
 */
export function ThumbnailComponent({
  block = 'qc-thumbnail',
  children,
  class: className = 'qc-thumbnail',
  describedBy,
  loading,
  onClick,
  presentation,
  widgetOptions,
}: Readonly<Props>) {
  const i18n = useI18n();
  const clickHandler = () => {
    if (widgetOptions.onThumbnailClick) {
      widgetOptions.onThumbnailClick(presentation);
    } else {
      onClick?.();
    }
  };

  return (
    <button type="button" class={className} aria-describedby={describedBy} onClick={clickHandler}>
      <span class="qc-sr-only">{i18n.t('common.PLAY_PRESENTATION', { title: decodeEntities(presentation.title ?? '') })}</span>
      <img
        class={`${block}__image`}
        src={presentation.thumbnail?.cdnUrl || presentation.thumbnail?.url}
        alt=""
        loading={loading}
      />
      {widgetOptions.playIconUrl ? (
        <img
          alt=""
          class={`${block}__play-button`}
          src={widgetOptions.playIconUrl}
        />
      ) : (
        <Icon
          name="play"
          class={`${block}__play-button ${block}__play-button--default`}
        />
      )}
      {children}
    </button>
  );
}
