import { PlayerSdk } from '@qumu/player-sdk';

type SdkEventName = Parameters<PlayerSdk['addEventListener']>[0];

// the SDK promises never settle when the player does not answer, e.g. a broken presentation
export const SDK_TIMEOUT = 10_000;

/**
 * A small wrapper around the Player SDK of an item's iframe, used by the PlaylistWidget instead of the SDK itself:
 * - the requests time out, the SDK would wait forever for a player which never answers
 * - the commands and the events are ignored once destroyed, the old item's player may still send messages
 * - the commands never throw, e.g. for an out-of-range value
 */
export class PlayerController {
  readonly sdk: PlayerSdk;
  private destroyed = false;

  constructor(iframe: HTMLIFrameElement, private readonly timeout = SDK_TIMEOUT) {
    this.sdk = new PlayerSdk(iframe);
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Listens to a player event until the controller is destroyed
   */
  on<T = unknown>(name: SdkEventName, callback: (value: T) => void): void {
    if (this.destroyed) {
      return;
    }

    this.sdk.addEventListener(name, (value?: unknown) => {
      if (!this.destroyed) {
        callback(value as T);
      }
    });
  }

  /**
   * Sends a request to the player, rejected after the timeout or when the controller is destroyed in the meantime
   */
  request<T>(call: (sdk: PlayerSdk) => Promise<T>): Promise<T> {
    if (this.destroyed) {
      return Promise.reject(new Error('The player is destroyed'));
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The player did not answer')), this.timeout);

      call(this.sdk).then(
        (value) => {
          clearTimeout(timer);

          if (this.destroyed) {
            reject(new Error('The player is destroyed'));
          } else {
            resolve(value);
          }
        },
        (err: unknown) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      );
    });
  }

  /**
   * Sends a command to the player, the commands are fire-and-forget
   */
  command(call: (sdk: PlayerSdk) => void): void {
    if (this.destroyed) {
      return;
    }

    try {
      call(this.sdk);
    } catch (err) {
      console.warn(err);
    }
  }

  /**
   * Stops listening to the player and lets it flush its view statistics: the iframe must be kept in the page
   * for a short time after, so the message is delivered (see PLAYER_REMOVAL_DELAY)
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    try {
      this.sdk.destroy();
    } catch (err) {
      console.warn(err);
    }
  }
}
