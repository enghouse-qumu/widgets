import { ListWidgetStyle } from './list-widget-style';
import { WidgetStyle } from './widget-style';

// `columns` and `minItemWidth` apply to the modal layout only: the max items per page and the min item width
export interface CarouselWidgetStyle extends ListWidgetStyle {
  // the play button style, without its margin and with its own position. The padding is around the default icon,
  // which fills the rest of the arrow; it is not applied to a custom icon
  arrows: Omit<WidgetStyle['playButton'], 'margin' | 'position'> & Partial<{
    // outside: the spacing between the arrows and the items, the arrows are at the widget edges;
    // overlay: the spacing between the arrows and the widget edges
    horizontalGap: string;
    // over the item edges, or beside the track
    position: 'overlay' | 'outside';
  }>;
  dots: Partial<{
    // when pressed
    activeColor: string;
    // 100% by default, round dots
    borderRadius: string;
    color: string;
    // the spacing between the dots
    horizontalGap: string;
    hoverColor: string;
    // below or above the items
    position: 'bottom' | 'top';
    // the dot of the current page
    selectedColor: string;
    size: string;
    // the spacing between the dots and the items
    verticalGap: string;
  }>;
  // the page slide
  transitionDuration: string;
}
