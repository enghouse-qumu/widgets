import { WidgetConfiguration } from './widget-configuration';
import { WidgetOptions } from './widget-options';
import { Presentation } from './presentation';
import { InfoFieldConfig } from './item-template-config';
import { ListWidgetSource } from './list-widget-source';
import { PlaylistWidgetStyle } from './playlist-widget-style';

export interface PlaylistWidgetConfiguration extends Omit<WidgetConfiguration, 'guid' | 'host' | 'sortBy' | 'sortOrder'> {
  source: ListWidgetSource;
  widgetOptions?: Partial<PlaylistWidgetOptions>;
}

export interface PlaylistWidgetOptions extends Omit<WidgetOptions, 'playbackMode' | 'onThumbnailClick' | 'style'> {
  // how the first item starts, the following items always autoplay
  playbackMode: 'inline' | 'inline-autoload' | 'inline-autoplay';
  controls: Partial<PlaylistControls>;
  // false: keeps the player loaded but visually hidden, for audio-style playlists
  showPlayer: boolean;
  // after the last item, continue with the first one
  loop: boolean;
  // remembers the progress of each presentation in the local storage
  trackProgress: boolean;
  item: Partial<PlaylistItemTemplateConfig>;
  style: Partial<PlaylistWidgetStyle>;

  onItemChange(presentation: Presentation, index: number): void;

  onPlaylistEnd(): void;
}

// Optional buttons; play/pause, previous/next, the seek bar and the times are always shown.
// A button is also hidden when the current item has nothing to offer.
export interface PlaylistControls {
  audioTracks: boolean;
  // live only
  audienceReactions: boolean;
  // not shown when `showPlayer` is false
  captions: boolean;
  // not shown when `showPlayer` is false
  fullscreen: boolean;
  playbackRate: boolean;
  // not shown when `showPlayer` is false
  quality: boolean;
  // the slider is not shown on touch devices
  volume: boolean;
}

// Playlist rows expose only the left and right info slots
export type PlaylistInfoSlot = 'left' | 'right';

export interface PlaylistItemTemplateConfig {
  info: Partial<Record<PlaylistInfoSlot, InfoFieldConfig[]>>;
}
