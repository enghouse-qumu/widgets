import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { SdkAudioTrack, SdkCaptionTrack } from '@qumu/player-sdk';
import { PlaylistControls } from '@/interfaces/playlist-widget';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { formatDuration, formatDurationText } from '@/utils/presentation-fields';
import { MenuButtonComponent, MenuOptions, SubMenu } from './menu-button';

// seek and volume steps of the keyboard
const SEEK_STEP = 5000;
const VOLUME_STEP = 5;

export interface PlayerState {
  audioTrack: string | null;
  audioTracks: SdkAudioTrack[];
  captionTrack: string | null;
  captionTracks: SdkCaptionTrack[];
  // in milliseconds
  currentTime: number;
  duration: number;
  // the quality selected in the widget: a level key, or `auto`
  level: string;
  levels: Array<{ key: string; value: number }>;
  live: boolean;
  // a running live event, the audience reactions are only available then
  liveRunning: boolean;
  paused: boolean;
  playbackRate: number;
  playbackRates: number[];
  reactions: string[];
  // the player answered at least once, the controls are disabled until then
  ready: boolean;
  // between 0 and 100
  volume: number;
}

export interface PlaylistControlsHandlers {
  onAudioTrack(code: string): void;
  onCaptionTrack(languageCode: string | null): void;
  onFullscreen(): void;
  onMenuOpenChange(open: boolean): void;
  onMute(): void;
  onNext(): void;
  onPlayPause(): void;
  onPlaybackRate(rate: number): void;
  onPrevious(): void;
  onQuality(key: string): void;
  onReaction(reaction: string): void;
  onSeek(time: number): void;
  onVolume(volume: number): void;
}

interface Props extends Partial<PlaylistControlsHandlers> {
  controls: PlaylistControls;
  // every control is disabled, e.g. while the presentations are loading
  disabled?: boolean;
  fullscreen?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  // false: the player is visually hidden, the controls it needs are not shown
  showPlayer?: boolean;
  // the current item shows its packshot, the player is not loaded yet: only the play button is enabled
  packshot?: boolean;
  state: PlayerState;
}

export const emptyPlayerState: PlayerState = {
  audioTrack: null,
  audioTracks: [],
  captionTrack: null,
  captionTracks: [],
  currentTime: 0,
  duration: 0,
  level: 'auto',
  levels: [],
  live: false,
  liveRunning: false,
  paused: true,
  playbackRate: 1,
  playbackRates: [],
  reactions: [],
  ready: false,
  volume: 100,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * The value of a range input for the keyboard: arrows by step, Page Up / Page Down by 10%, Home / End.
 * Returns `undefined` for the other keys, left to the browser.
 */
function getKeyboardValue(key: string, value: number, max: number, step: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(value + step, 0, max);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(value - step, 0, max);
    case 'PageUp':
      return clamp(value + max / 10, 0, max);
    case 'PageDown':
      return clamp(value - max / 10, 0, max);
    case 'Home':
      return 0;
    case 'End':
      return max;
    default:
      return undefined;
  }
}

function isTouchDevice(): boolean {
  return globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export function PlaylistControlsComponent({
  controls,
  disabled = false,
  fullscreen = false,
  hasNext = false,
  hasPrevious = false,
  showPlayer = true,
  packshot = false,
  state,
  ...handlers
}: Readonly<Props>) {
  const i18n = useI18n();
  // the time displayed while the seek bar is dragged, the seek is only sent on release
  const [dragTime, setDragTime] = useState<number | null>(null);
  // iOS ignores the volume changes, only the mute toggle is shown on touch devices
  const [touch] = useState(isTouchDevice);
  const locale = i18n.getLocale();
  // not rebuilt on every time update
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const percentFormat = useMemo(() => new Intl.NumberFormat(locale, { style: 'percent' }), [locale]);
  // the player controls are enabled once the player answered
  const playerDisabled = disabled || packshot || !state.ready;
  const time = dragTime ?? state.currentTime;
  const muted = state.volume === 0;

  const timeText = i18n.t('playlist.TIME_OF_DURATION', {
    current: formatDurationText(time),
    duration: formatDurationText(state.duration),
  });

  const handleSeekKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    const value = getKeyboardValue(event.key, time, state.duration, SEEK_STEP);

    if (value !== undefined) {
      event.preventDefault();
      setDragTime(null);
      handlers.onSeek?.(value);
    }
  };

  // after the `change` of the same release, if any
  const releaseSeek = () => {
    setTimeout(() => setDragTime(null));
  };

  const handleVolumeKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    const value = getKeyboardValue(event.key, state.volume, 100, VOLUME_STEP);

    if (value !== undefined) {
      event.preventDefault();
      handlers.onVolume?.(Math.round(value));
    }
  };

  // The language names and labels of the legacy widget: a translated name for the language code of the track,
  // or the title given by the player for an unknown code
  const languageName = (languageCode: string | undefined, title: string | undefined) => {
    const key = `playlist.languages.${languageCode}`;
    const name = languageCode ? i18n.t(key) : key;

    return name === key ? title || languageCode || '' : name;
  };

  // "None" first, then the tracks sorted by name, like the legacy widget
  const captionTracks = state.captionTracks
    .map((track) => ({
      label: track.source === 'AUTOGENERATED'
        ? `${languageName(track.languageCode, track.title)} ${i18n.t('playlist.AUTO_CAPTIONS')}`
        : languageName(track.languageCode, track.title),
      track,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  const captionOptions: MenuOptions = {
    items: [
      {
        checked: !state.captionTrack,
        key: 'none',
        label: i18n.t('playlist.None'),
        onSelect: () => handlers.onCaptionTrack?.(null),
      },
      ...captionTracks.map(({ label, track }) => ({
        checked: state.captionTrack === track.languageCode,
        key: track.guid || track.languageCode,
        label,
        onSelect: () => handlers.onCaptionTrack?.(track.languageCode),
      })),
    ],
    type: 'radio',
  };

  // the original tracks first, then the tracks sorted by name, like the legacy widget
  const audioTracks = state.audioTracks
    .map((track) => ({
      label: [
        languageName(track.languageCode, (track as { title?: string }).title),
        track.isOriginal && i18n.t('playlist.Original'),
        track.isAudioDescription && i18n.t('playlist.Audio description'),
      ].filter(Boolean).join(' '),
      track,
    }))
    .sort((a, b) => Number(b.track.isOriginal) - Number(a.track.isOriginal) || a.label.localeCompare(b.label, locale));

  const audioOptions: MenuOptions = {
    items: audioTracks.map(({ label, track }) => ({
      checked: state.audioTrack === track.code,
      key: track.code,
      label,
      onSelect: () => handlers.onAudioTrack?.(track.code),
    })),
    type: 'radio',
  };

  // the settings menu, like the one of the player: a submenu per setting the current item offers
  const settings: SubMenu[] = [];

  if (controls.playbackRate && state.playbackRates.length > 1) {
    settings.push({
      icon: 'playback-rate',
      items: state.playbackRates.map((rate) => ({
        checked: state.playbackRate === rate,
        key: String(rate),
        label: rate === 1 ? i18n.t('playlist.Normal') : `${numberFormat.format(rate)}×`,
        onSelect: () => handlers.onPlaybackRate?.(rate),
      })),
      key: 'speed',
      label: i18n.t('playlist.Playback speed'),
      type: 'radio',
    });
  }

  if (controls.quality && showPlayer && state.levels.length) {
    settings.push({
      icon: 'hd',
      items: [
        {
          checked: state.level === 'auto',
          key: 'auto',
          label: i18n.t('playlist.Auto'),
          onSelect: () => handlers.onQuality?.('auto'),
        },
        ...state.levels.map(({ key }) => ({
          checked: state.level === key,
          key,
          label: key,
          onSelect: () => handlers.onQuality?.(key),
        })),
      ],
      key: 'quality',
      label: i18n.t('playlist.Quality'),
      type: 'radio',
    });
  }

  const reactionOptions: MenuOptions = {
    items: state.reactions.map((reaction) => ({
      key: reaction,
      label: reaction,
      onSelect: () => handlers.onReaction?.(reaction),
    })),
    type: 'action',
  };

  const showCaptions = controls.captions && showPlayer && state.captionTracks.length > 0;
  const showAudioTracks = controls.audioTracks && state.audioTracks.length > 1;
  const showReactions = controls.audienceReactions && state.liveRunning && state.reactions.length > 0;
  const showFullscreen = controls.fullscreen && showPlayer && !!document.fullscreenEnabled;
  const onMenuOpenChange = (open: boolean) => handlers.onMenuOpenChange?.(open);
  const playing = !state.paused && !packshot;

  return (
    <div
      class={`qc-playlist-controls${disabled ? ' qc-playlist-controls--disabled' : ''}`}
      role="group"
      aria-label={i18n.t('playlist.Player controls')}
    >
      <div class="qc-playlist-controls__timeline">
        {state.live ? (
          <span class="qc-playlist-controls__live">{i18n.t('playlist.Live')}</span>
        ) : (
          <>
            <span class="qc-playlist-controls__time" aria-hidden="true">{formatDuration(time)}</span>
            <input
              type="range"
              class="qc-playlist-controls__seek"
              aria-label={i18n.t('playlist.Seek')}
              aria-valuetext={timeText}
              min={0}
              max={state.duration || 0}
              step={100}
              value={time}
              disabled={playerDisabled || !state.duration}
              style={{ '--_qc-plw-progress': `${state.duration ? (time / state.duration) * 100 : 0}%` }}
              onInput={(event) => setDragTime(Number(event.currentTarget.value))}
              // a native `change` event, on release: do not import `preact/compat`, which turns `onChange` into `onInput`
              onChange={(event) => {
                setDragTime(null);
                handlers.onSeek?.(Number(event.currentTarget.value));
              }}
              onKeyDown={handleSeekKeyDown}
              // released where the drag started: no `change`, the bar follows the playback again
              onPointerCancel={releaseSeek}
              onPointerUp={releaseSeek}
            />
            <span class="qc-playlist-controls__time" aria-hidden="true">{formatDuration(state.duration)}</span>
          </>
        )}
      </div>
      <div class="qc-playlist-controls__bar">
        <div class="qc-playlist-controls__start">
          {controls.volume && (
            <div class="qc-playlist-controls__volume">
              <button
                type="button"
                class="qc-playlist-controls__button"
                aria-label={i18n.t(muted ? 'playlist.Unmute' : 'playlist.Mute')}
                disabled={playerDisabled}
                onClick={() => handlers.onMute?.()}
              >
                <Icon name={muted ? 'mute' : 'volume-max'}/>
              </button>
              {!touch && (
                <input
                  type="range"
                  class="qc-playlist-controls__volume-slider"
                  aria-label={i18n.t('playlist.Volume')}
                  aria-valuetext={percentFormat.format(state.volume / 100)}
                  min={0}
                  max={100}
                  step={1}
                  value={state.volume}
                  disabled={playerDisabled}
                  style={{ '--_qc-plw-progress': `${state.volume}%` }}
                  onInput={(event) => handlers.onVolume?.(Number(event.currentTarget.value))}
                  onKeyDown={handleVolumeKeyDown}
                />
              )}
            </div>
          )}
        </div>
        <div class="qc-playlist-controls__center">
          <button
            type="button"
            class="qc-playlist-controls__button"
            aria-label={i18n.t('playlist.Previous')}
            disabled={disabled || !hasPrevious}
            onClick={() => handlers.onPrevious?.()}
          >
            {/* the next icon, flipped */}
            <Icon name="skip" class="qc-playlist-controls__icon--flip"/>
          </button>
          <button
            type="button"
            class="qc-playlist-controls__button qc-playlist-controls__button--play"
            aria-label={i18n.t(playing ? 'playlist.Pause' : 'playlist.Play')}
            // in the packshot state, the play button loads the player; disabled while an item is loading
            disabled={disabled || (!packshot && !state.ready)}
            onClick={() => handlers.onPlayPause?.()}
          >
            <Icon name={playing ? 'pause' : 'play'}/>
          </button>
          <button
            type="button"
            class="qc-playlist-controls__button"
            aria-label={i18n.t('playlist.Next')}
            disabled={disabled || !hasNext}
            onClick={() => handlers.onNext?.()}
          >
            <Icon name="skip"/>
          </button>
        </div>
        <div class="qc-playlist-controls__end">
          {showAudioTracks && (
            <MenuButtonComponent
              class="qc-playlist-controls__audio-tracks"
              disabled={playerDisabled}
              icon="user-sound"
              label={i18n.t('playlist.Audio languages')}
              menu={audioOptions}
              onOpenChange={onMenuOpenChange}
            />
          )}
          {showCaptions && (
            <MenuButtonComponent
              class="qc-playlist-controls__captions"
              disabled={playerDisabled}
              menu={captionOptions}
              icon="cc"
              label={i18n.t('playlist.Captions')}
              onOpenChange={onMenuOpenChange}
            />
          )}
          {settings.length > 0 && (
            <MenuButtonComponent
              backLabel={i18n.t('playlist.Back to menu')}
              class="qc-playlist-controls__settings"
              disabled={playerDisabled}
              menu={{ submenus: settings }}
              icon="settings"
              label={i18n.t('playlist.Settings')}
              onOpenChange={onMenuOpenChange}
            />
          )}
          {showReactions && (
            <MenuButtonComponent
              class="qc-playlist-controls__reactions"
              disabled={playerDisabled}
              menu={reactionOptions}
              icon="smiley"
              label={i18n.t('playlist.Reactions')}
              onOpenChange={onMenuOpenChange}
            />
          )}
          {showFullscreen && (
            <button
              type="button"
              class="qc-playlist-controls__button"
              aria-label={i18n.t(fullscreen ? 'playlist.Exit fullscreen' : 'playlist.Fullscreen')}
              disabled={disabled || packshot}
              onClick={() => handlers.onFullscreen?.()}
            >
              <Icon name={fullscreen ? 'shrink' : 'expand'}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
