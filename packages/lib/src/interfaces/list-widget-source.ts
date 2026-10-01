import { SearchFilter } from './search-filter';

export interface ListWidgetSourceBase {
  host: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASCENDING' | 'DESCENDING';
}

export type ListWidgetSource = ListWidgetSourceBase & (
  | {
    presentationGuids?: never;
    smartSearch?: never;
    smartSearchGuid: string;
  }
  | {
    presentationGuids: string[];
    smartSearchGuid?: never;
    smartSearch?: never;
  }
  | {
    presentationGuids?: never;
    smartSearchGuid?: never;
    smartSearch: SearchFilter;
  }
);
