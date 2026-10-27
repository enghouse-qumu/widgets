import { WidgetConfiguration } from './widget-configuration';
import { WidgetOptions } from './widget-options';
import { Presentation } from './presentation';
import { CarouselWidgetStyle } from './carousel-widget-style';
import { InfoFieldConfig } from './item-template-config';
import { ListWidgetSource } from './list-widget-source';

export interface CarouselWidgetConfiguration extends Omit<WidgetConfiguration, 'guid' | 'host' | 'sortBy' | 'sortOrder'> {
  source: ListWidgetSource;
  widgetOptions?: Partial<CarouselWidgetOptions>;
}

export interface CarouselWidgetOptions extends Omit<WidgetOptions, 'onThumbnailClick' | 'style'> {
  // 'modal': several items per page, the player opens in a modal; the inline modes: one item per page
  playbackMode: 'inline' | 'inline-autoload' | 'inline-autoplay' | 'modal';
  item: Partial<CarouselItemTemplateConfig>;
  navigation: Partial<{
    arrows: boolean;
    dots: boolean;
  }>;
  // custom arrow icon images, like `playIconUrl`: they replace the default round buttons
  nextIconUrl: string;
  previousIconUrl: string;
  style: Partial<CarouselWidgetStyle>;
  // fired on a click on a packshot item; when set, it replaces the modal or the inline playback
  onItemClick(presentation: Presentation): void;
}

// the carousel items expose only the top and bottom info slots
export type CarouselInfoSlot = 'top' | 'bottom';

export interface CarouselItemTemplateConfig {
  showDurationOverlay: boolean;
  info: Partial<Record<CarouselInfoSlot, InfoFieldConfig[]>>;
}
