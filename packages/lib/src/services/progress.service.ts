// the key and the format of the legacy widgets, so the viewers keep their progress after the migration
export const PROGRESS_STORAGE_KEY = 'qumu-widget-progress';

// written by the legacy widgets for the live items watched while live, read as watched
const LEGACY_WATCHED_LIVE = -100;

/**
 * The viewing progress of the presentations, in percent, kept in the local storage as `{ [guid]: percent }`.
 * Every access is guarded: without storage (private mode, blocked storage…) the service is unavailable and the
 * widget behaves as if the progress tracking was disabled.
 */
export class ProgressService {
  readonly available: boolean;

  constructor(enabled = true) {
    this.available = enabled && ProgressService.isStorageAvailable();
  }

  private static isStorageAvailable(): boolean {
    try {
      const storage = globalThis.localStorage;
      const testKey = `${PROGRESS_STORAGE_KEY}-test`;

      storage.setItem(testKey, '1');
      storage.removeItem(testKey);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the progress of the presentation between 0 and 100, or `undefined` when it has none
   */
  get(guid: string | undefined): number | undefined {
    if (!guid) {
      return undefined;
    }

    const value = this.read()[guid];

    if (value === LEGACY_WATCHED_LIVE) {
      return 100;
    }

    return typeof value === 'number' && Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : undefined;
  }

  isWatched(guid: string | undefined): boolean {
    return this.get(guid) === 100;
  }

  set(guid: string | undefined, percent: number): void {
    if (!guid || !Number.isFinite(percent)) {
      return;
    }

    const progress = this.read();

    // one decimal is precise enough to resume within a second of a 15 minutes presentation
    progress[guid] = Math.round(Math.min(Math.max(percent, 0), 100) * 10) / 10;
    this.write(progress);
  }

  private read(): Record<string, unknown> {
    if (!this.available) {
      return {};
    }

    try {
      const value: unknown = JSON.parse(globalThis.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? '{}');

      return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private write(progress: Record<string, unknown>): void {
    if (!this.available) {
      return;
    }

    try {
      globalThis.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // the storage is full or was blocked since, the progress is not kept
    }
  }
}
