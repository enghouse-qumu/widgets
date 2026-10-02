import { ComponentChildren } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { WidgetOptions } from '@/interfaces/widget-options';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { decodeEntities } from '@/utils/presentation-fields';

interface Props {
  // e.g. the duration badge of the list widget
  children?: ComponentChildren;
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
  children,
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
    <button type="button" class="qc-thumbnail" aria-describedby={describedBy} onClick={clickHandler}>
      <span class="qc-sr-only">{i18n.t('common.PLAY_PRESENTATION', { title: decodeEntities(presentation.title ?? '') })}</span>
      <img
        class="qc-thumbnail__image"
        src={presentation.thumbnail?.cdnUrl || presentation.thumbnail?.url}
        alt=""
        loading={loading}
      />
      {widgetOptions.playIconUrl ? (
        <img
          alt=""
          class="qc-thumbnail__play-button"
          src={widgetOptions.playIconUrl}
        />
      ) : (
        <Icon
          name="play"
          class="qc-thumbnail__play-button qc-thumbnail__play-button--default"
        />
      )}
      {children}
    </button>
  );
}
