export type InfoSlot = 'top' | 'left' | 'right' | 'bottom';

export interface ItemTemplateConfig {
  showDurationOverlay: boolean;
  info: Partial<Record<InfoSlot, InfoFieldConfig[]>>;
}

export interface InfoFieldConfig {
  field: string;
  // true: the default label, false: no label, a string: a custom label.
  // When unset, the default label is shown for all the fields but `title` and `summary`
  label?: string | boolean;
}
