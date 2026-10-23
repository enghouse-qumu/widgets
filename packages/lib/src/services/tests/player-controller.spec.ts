import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerController } from '../player-controller';

const sdkMock = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  destroy: vi.fn(),
  getDuration: vi.fn(),
  play: vi.fn(),
  setVolume: vi.fn(),
}));

vi.mock('@qumu/player-sdk', () => ({
  // a function, called with `new`
  // eslint-disable-next-line prefer-arrow-callback
  PlayerSdk: vi.fn(function PlayerSdk() {
    return sdkMock;
  }),
}));

describe('PlayerController', () => {
  let controller: PlayerController;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    controller = new PlayerController(document.createElement('iframe'), 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should resolve the requests', async () => {
    sdkMock.getDuration.mockResolvedValue(1234);

    await expect(controller.request((sdk) => sdk.getDuration())).resolves.toBe(1234);
  });

  it('should reject the requests the player does not answer', async () => {
    sdkMock.getDuration.mockReturnValue(new Promise(() => undefined));

    const request = controller.request((sdk) => sdk.getDuration());

    vi.advanceTimersByTime(1000);

    await expect(request).rejects.toThrow('The player did not answer');
  });

  it('should reject the answers received once destroyed', async () => {
    let resolve: (value: number) => void = () => undefined;

    sdkMock.getDuration.mockReturnValue(new Promise((done) => {
      resolve = done;
    }));

    const request = controller.request((sdk) => sdk.getDuration());

    controller.destroy();
    resolve(1234);

    await expect(request).rejects.toThrow('The player is destroyed');
    await expect(controller.request((sdk) => sdk.getDuration())).rejects.toThrow('The player is destroyed');
  });

  it('should forward the events until destroyed', () => {
    const callback = vi.fn();

    controller.on('timeupdate', callback);

    const listener = sdkMock.addEventListener.mock.calls[0][1] as (value: number) => void;

    listener(1000);
    controller.destroy();
    listener(2000);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1000);
  });

  it('should send the commands, without throwing', () => {
    sdkMock.setVolume.mockImplementation(() => {
      throw new Error('The volume must be between 0 and 100');
    });

    controller.command((sdk) => sdk.play());

    expect(sdkMock.play).toHaveBeenCalled();
    expect(() => controller.command((sdk) => sdk.setVolume(200))).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should ignore the commands once destroyed', () => {
    controller.destroy();
    controller.command((sdk) => sdk.play());

    expect(sdkMock.play).not.toHaveBeenCalled();
  });

  it('should destroy the SDK once', () => {
    controller.destroy();
    controller.destroy();

    expect(controller.isDestroyed).toBe(true);
    expect(sdkMock.destroy).toHaveBeenCalledTimes(1);
  });
});
