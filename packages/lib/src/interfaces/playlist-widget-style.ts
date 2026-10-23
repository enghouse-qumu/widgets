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
  // the colors of the control bar, like the player: the other colors are derived from these,
  // e.g. the hover backgrounds, the menus, the tracks of the sliders, the focus rings
  controls: Partial<{
    fontFamily: string;
    fontSize: string;
    gap: string;
    padding: string;
    // the bar, the times, the buttons, the menus, the sliders
    general: Partial<{
      backgroundColor: string;
      color: string;
    }>;
    // the current option of the menus, the focus rings, the played part of the seek bar
    primary: Partial<{
      backgroundColor: string;
      color: string;
    }>;
    // play/pause, previous, next, volume, captions, audio tracks, settings, reactions, fullscreen
    buttons: Partial<{
      iconSize: string;
      size: string;
    }>;
    // captions, audio tracks, settings, reactions
    menu: Partial<{
      borderRadius: string;
    }>;
    // the seek bar and the volume slider
    timeline: Partial<{
      height: string;
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
