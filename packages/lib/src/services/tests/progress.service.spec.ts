import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROGRESS_STORAGE_KEY, ProgressService } from '../progress.service';

describe('ProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should read the legacy format', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      a: 42.5,
      b: 100,
      c: -100,
    }));

    const service = new ProgressService();

    expect(service.get('a')).toBe(42.5);
    expect(service.isWatched('a')).toBe(false);
    expect(service.isWatched('b')).toBe(true);
    // watched while live, by the legacy widgets
    expect(service.get('c')).toBe(100);
    expect(service.get('unknown')).toBeUndefined();
    expect(service.get(undefined)).toBeUndefined();
  });

  it('should write the progress, rounded and keeping the other entries', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ other: 10 }));

    const service = new ProgressService();

    service.set('a', 33.3333);
    service.set('b', 150);

    expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!)).toEqual({
      a: 33.3,
      b: 100,
      other: 10,
    });
  });

  it('should ignore an invalid stored value', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, '{invalid');

    const service = new ProgressService();

    expect(service.get('a')).toBeUndefined();

    service.set('a', 50);

    expect(service.get('a')).toBe(50);
  });

  it('should be unavailable when disabled', () => {
    const service = new ProgressService(false);

    service.set('a', 50);

    expect(service.available).toBe(false);
    expect(service.get('a')).toBeUndefined();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it('should be unavailable without storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const service = new ProgressService();

    expect(service.available).toBe(false);
    expect(() => service.set('a', 50)).not.toThrow();
  });
});
