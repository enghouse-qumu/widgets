import { WidgetOptions } from './widget-options';
import { PlayerParameters } from './player-parameters';

type RecursiveRecord = {
  [key: string]: string | RecursiveRecord;
};

export interface WidgetConfiguration {
  guid: string;
  host: string;
  layout?: 'featured' | 'grid' | 'list';
  locales?: RecursiveRecord;
  playerParameters?: Partial<PlayerParameters>;
  selector: string | HTMLElement;
  sortBy?: string;
  sortOrder?: 'ASCENDING' | 'DESCENDING';
  widgetOptions?: Partial<WidgetOptions>;
}
