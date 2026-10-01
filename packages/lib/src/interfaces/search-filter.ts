export interface SearchFilter {
  match: 'any' | 'all';
  rules: SearchRule[];
}

export interface SearchRule {
  field: string;
  comparator: 'is' | 'is_not' | 'contains' | 'does_not_contain' | 'contains_any' | 'less_than' | 'greater_than'
    | 'greater_than_or_equal_to' | 'less_than_or_equal_to' | 'between' | 'not_between' | 'in_the_last' | 'not_in_the_last'
    | 'in_the_next' | 'not_in_the_next';
  value: string;
}
