import { Position, WidgetStyle } from './widget-style';

export interface ListWidgetStyle extends Omit<WidgetStyle, 'playButton' | 'thumbnail'> {
  gap: string;
  // grid only — 'auto': as many `minItemWidth` columns as fit; number: at most that many columns,
  // fewer when the items would get narrower than `minItemWidth`
  columns: 'auto' | number;
  minItemWidth: string;
  item: Partial<{
    // when pressed or focused with the keyboard, falls back to `hoverBorder`
    activeBorder: string;
    backgroundColor: string;
    border: string;
    borderRadius: string;
    boxShadow: string;
    // spacing between the fields of an info slot
    fieldGap: string;
    hoverBackgroundColor: string;
    // falls back to `border`
    hoverBorder: string;
    padding: string;
    // spacing between the thumbnail and the info slots, in both directions;
    // defaults to 8px from the top/bottom slots and 12px from the left/right ones
    thumbnailGap: string;
    thumbnail: Partial<{
      borderRadius: string;
      border: string;
      aspectRatio: string;
      imageFit: 'contain' | 'cover';
      width: string;
    }>;
    playButton: WidgetStyle['playButton'];
    durationBadge: Partial<{
      backgroundColor: string;
      borderRadius: string;
      color: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      letterSpacing: string;
      padding: string;
      position: Position;
      textTransform: string;
    }>;
    metadata: Record<string, Partial<{
      color: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      hoverColor: string;
      hoverLabelColor: string;
      labelColor: string;
      letterSpacing: string;
      lineClamp: number;
      padding: string;
      textTransform: string;
    }>>;
  }>;
}
