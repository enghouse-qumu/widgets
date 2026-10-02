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
    presentationGuids?: never;
    smartSearch?: never;
    smartSearchGuid: string;
  } & ListWidgetSort
  | {
    presentationGuids: string[];
    smartSearch?: never;
    smartSearchGuid?: never;
    sortBy?: never;
    sortOrder?: never;
  }
  | {
    presentationGuids?: never;
    smartSearch: SearchFilter;
    smartSearchGuid?: never;
  } & ListWidgetSort
);
