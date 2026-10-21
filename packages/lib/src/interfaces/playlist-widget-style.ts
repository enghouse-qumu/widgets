import { WidgetStyle } from './widget-style';
import { ListWidgetStyle } from './list-widget-style';

export interface PlaylistWidgetStyle extends Omit<ListWidgetStyle, 'columns' | 'minItemWidth' | 'item'> {
  player: Partial<{
    // defaults to the aspect ratio of the current presentation
    aspectRatio: string;
    // behind the letterboxing and while loading
    backgroundColor: string;
    maxHeight: string;
    // the play button over the packshot, before the first item is loaded
    playButton: WidgetStyle['playButton'];
  }>;
  controls: Partial<{
    backgroundColor: string;
    // the times
    color: string;
    fontFamily: string;
    fontSize: string;
    gap: string;
    padding: string;
    // play/pause, previous, next, volume, captions, audio tracks, settings, reactions, fullscreen
    buttons: Partial<{
      backgroundColor: string;
      color: string;
      hoverBackgroundColor: string;
      hoverColor: string;
      iconSize: string;
      size: string;
    }>;
    // captions, audio tracks, settings, reactions
    menu: Partial<{
      // the selected option
      activeBackgroundColor: string;
      activeColor: string;
      backgroundColor: string;
      borderRadius: string;
      color: string;
      hoverBackgroundColor: string;
    }>;
    timeline: Partial<{
      height: string;
      progressColor: string;
      thumbColor: string;
      trackColor: string;
    }>;
  }>;
  list: Partial<{
    backgroundColor: string;
    maxHeight: string;
  }>;
  item: Omit<NonNullable<ListWidgetStyle['item']>, 'durationBadge' | 'playButton' | 'thumbnail' | 'thumbnailGap'> & Partial<{
    activeBackgroundColor: string;
    activeColor: string;
    statusIconColor: string;
    watchedColor: string;
  }>;
}
