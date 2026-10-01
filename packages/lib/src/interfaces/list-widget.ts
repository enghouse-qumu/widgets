import { WidgetConfiguration } from './widget-configuration';
import { WidgetOptions } from './widget-options';
import { Presentation } from './presentation';
import { ListWidgetStyle } from './list-widget-style';
import { ItemTemplateConfig } from './item-template-config';
import { ListWidgetSource } from './list-widget-source';

export interface ListWidgetConfiguration extends Omit<WidgetConfiguration, 'guid' | 'host' | 'sortBy' | 'sortOrder'> {
  source: ListWidgetSource;
  widgetOptions?: Partial<ListWidgetOptions>;
}

export interface ListWidgetOptions extends Omit<WidgetOptions, 'playbackMode' | 'onThumbnailClick'> {
  item: Partial<ItemTemplateConfig>;
  layout: 'grid' | 'vertical';
  style: Partial<ListWidgetStyle>;
  onItemClick(presentation: Presentation): void;
}
