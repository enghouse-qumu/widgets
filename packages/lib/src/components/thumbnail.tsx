import { Presentation } from '@/interfaces/presentation';
import { WidgetOptions } from '@/interfaces/widget-options';
import { useI18n } from '@/i18n';
import { ThumbnailMediaComponent } from '@/components/thumbnail-media';
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
      <ThumbnailMediaComponent
        block="qc-thumbnail"
        playIconUrl={widgetOptions.playIconUrl}
        presentation={presentation}
      />
    </button>
  );
}
