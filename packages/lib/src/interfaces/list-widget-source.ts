import { SearchFilter } from './search-filter';

export interface ListWidgetSourceBase {
  host: string;
  limit?: number;
  offset?: number;
}

interface ListWidgetSort {
  sortBy?: string;
  sortOrder?: 'ASCENDING' | 'DESCENDING';
}

export type ListWidgetSource = ListWidgetSourceBase & (
  | {
    smartSearchGuid: string;
  } & ListWidgetSort
  | {
    presentationGuids: string[];
  }
  | {
    smartSearch: SearchFilter;
  } & ListWidgetSort
);
