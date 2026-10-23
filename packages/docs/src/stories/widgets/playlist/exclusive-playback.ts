import type { PlaylistWidget } from 'lib';

/**
 * Only for this docs page, which shows several playlists: only one playlist has a player at a time.
 *
 * All the players of the page run in the same browser process, and Chrome may freeze the media of every one of them
 * when a player iframe is removed while another player exists, even paused. A playlist removes its previous player on
 * each item change, so two playlists with a player could freeze each other. A widget is never placed several times on
 * the same page in production, so this is not part of the widget.
 *
 * When the viewer starts interacting with a playlist (or its own controls), the other playlists with a player are
 * created again: they show their first item, with no player, and resume from the stored progress when played again.
 * This happens on the press, before the click creates the player of the playlist, so no other player exists when their
 * players are removed. A playlist also pauses when its player is scrolled out of view.
 */

interface Playlist {
  ready: Promise<PlaylistWidget>;
  // the current widget, once created
  widget?: PlaylistWidget;

  create(): Promise<PlaylistWidget>;
}

// by the element containing each playlist and its own controls (e.g. the buttons of the API example)
const playlists = new Map<HTMLElement, Playlist>();

let listening = false;

function pauseWhenOutOfView(root: HTMLElement, widget: PlaylistWidget): void {
  const player = root.querySelector<HTMLElement>('.qc-playlist__player-area');

  if (!player) {
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!player.isConnected) {
      observer.disconnect();
    } else if (!entry.isIntersecting) {
      widget.playerSdk?.pause();
    }
  });

  observer.observe(player);
}

function load(root: HTMLElement, playlist: Playlist): void {
  playlist.widget = undefined;
  playlist.ready = playlist.create();
  playlist.ready
    .then((widget) => {
      playlist.widget = widget;
      pauseWhenOutOfView(root, widget);
    })
    .catch(console.error);
}

function onInteraction(target: EventTarget | null): void {
  const root = [...playlists.keys()].find((element) => target instanceof Node && element.contains(target));

  if (!root) {
    return;
  }

  // synchronously, so the players are removed before the click creates the player of the playlist
  playlists.forEach((playlist, element) => {
    if (element !== root && playlist.widget && element.querySelector('iframe')) {
      playlist.widget.destroy();
      load(element, playlist);
    }
  });
}

function listen(): void {
  if (listening) {
    return;
  }

  listening = true;

  // on the press, before the click
  document.addEventListener('pointerdown', (event) => onInteraction(event.target), true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onInteraction(event.target);
    }
  }, true);
}

/**
 * Creates a playlist of the page, which is the only one with a player while the viewer interacts with it
 *
 * @param root the element containing the playlist and its own controls
 * @param create creates the widget, called again to remove its player
 * @returns the current widget of the playlist, which changes each time it is created again
 */
export function playOneAtATime(root: HTMLElement, create: () => Promise<PlaylistWidget>): () => Promise<PlaylistWidget> {
  const playlist = { create } as Playlist;

  listen();
  playlists.set(root, playlist);
  load(root, playlist);

  return () => playlist.ready;
}
