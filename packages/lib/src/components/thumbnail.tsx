import { Presentation } from '@/interfaces/presentation';
import { WidgetOptions } from '@/interfaces/widget-options';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { decodeEntities } from '@/utils/presentation-fields';

interface Props {
  onClick: () => void;
  presentation: Presentation;
  widgetOptions: Partial<WidgetOptions>;
}

export function ThumbnailComponent({ presentation, onClick, widgetOptions }: Readonly<Props>) {
  const i18n = useI18n();
  const clickHandler = () => {
    widgetOptions.onThumbnailClick ? widgetOptions.onThumbnailClick(presentation) : onClick();
  };

  return (
    <button type="button" class="qc-thumbnail" onClick={clickHandler}>
      <span class="qc-sr-only">{i18n.t('common.PLAY_PRESENTATION', { title: decodeEntities(presentation.title ?? '') })}</span>
      <img
        class="qc-thumbnail__image"
        src={presentation.thumbnail?.cdnUrl || presentation.thumbnail?.url}
        alt=""
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
    </button>
  );
}
