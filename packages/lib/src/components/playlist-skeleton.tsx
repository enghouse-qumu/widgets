import { PlaylistControls, PlaylistItemTemplateConfig } from '@/interfaces/playlist-widget';
import { ListSkeletonComponent } from './list-skeleton';
import { MetadataStyle } from './info-field';
import { emptyPlayerState, PlaylistControlsComponent } from './playlist-controls';

interface Props {
  controls: PlaylistControls;
  count: number;
  item: PlaylistItemTemplateConfig;
  metadataStyle?: MetadataStyle;
  showPlayer: boolean;
}

/**
 * Shown while the presentations are loading: a player-shaped placeholder, the disabled control bar and ghost rows
 */
export function PlaylistSkeletonComponent({ controls, count, item, metadataStyle, showPlayer }: Readonly<Props>) {
  return (
    <>
      <div class="qc-playlist__player-area" aria-hidden="true">
        {showPlayer && <div class="qc-playlist__player qc-playlist__player--skeleton"/>}
        <PlaylistControlsComponent controls={controls} disabled showPlayer={showPlayer} state={emptyPlayerState}/>
      </div>
      <ListSkeletonComponent count={count} item={item} layout="playlist" metadataStyle={metadataStyle} thumbnail={false}/>
    </>
  );
}
