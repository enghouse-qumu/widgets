import { Component, JSX } from 'preact';
import { Presentation } from '@/interfaces/presentation';
import { InfoFieldConfig } from '@/interfaces/item-template-config';
import { PlaylistInfoSlot, PlaylistItemTemplateConfig } from '@/interfaces/playlist-widget';
import { useI18n } from '@/i18n';
import Icon from '@/components/icon';
import { decodeEntities, formatDuration, formatDurationText } from '@/utils/presentation-fields';
import { MetadataStyle, renderInfoField } from './info-field';

export type PlaylistItemStatus = 'idle' | 'playing' | 'watched';

interface Props {
  active: boolean;
  // the id of the item, unique in the page; also prefixes the ids referenced by `aria-describedby`
  id: string;
  index: number;
  item: PlaylistItemTemplateConfig;
  metadataStyle?: MetadataStyle;
  presentation: Presentation;
  status: PlaylistItemStatus;
  // the watched time in milliseconds of a partially watched item, shown with the duration
  watchedTime?: number;
  onClick(index: number): void;
}

const statusIcons: Record<PlaylistItemStatus, string> = {
  idle: 'play',
  playing: 'pause',
  watched: 'restart',
};

function PlaylistItem({
  active,
  id,
  index,
  item,
  metadataStyle,
  presentation,
  status,
  watchedTime,
  onClick,
}: Readonly<Props>) {
  const i18n = useI18n();
  // ids of the elements announced as the button's description: the info fields (but the title, already in the name)
  const descriptionIds: string[] = [];

  const durationValue = (field: string) => {
    if (field !== 'duration' || watchedTime === undefined || !presentation.duration) {
      return undefined;
    }

    return (
      <>
        <span aria-hidden="true">{`${formatDuration(watchedTime)} / ${formatDuration(presentation.duration)}`}</span>
        <span class="qc-sr-only">
          {i18n.t('playlist.TIME_OF_DURATION', {
            current: formatDurationText(watchedTime),
            duration: formatDurationText(presentation.duration),
          })}
        </span>
      </>
    );
  };

  const renderField = (config: InfoFieldConfig, fieldId: string) => {
    const element = renderInfoField({
      config,
      id: fieldId,
      presentation,
      style: metadataStyle?.[config.field],
      value: durationValue(config.field),
    });

    if (element && config.field !== 'title') {
      descriptionIds.push(fieldId);
    }

    return element;
  };

  const renderSlot = (slot: PlaylistInfoSlot) => {
    const fields = item.info[slot];

    if (!fields?.length) {
      return null;
    }

    return (
      <dl class={`qc-list-item__info qc-playlist-item__info qc-playlist-item__info--${slot}`}>
        {fields.map((fieldConfig, fieldIndex) => renderField(fieldConfig, `${id}-${slot}-${fieldIndex}`))}
      </dl>
    );
  };

  // the slots are rendered first, to collect the description ids before rendering the button
  const leftSlot = renderSlot('left');
  const rightSlot = renderSlot('right');

  let statusText: string | null = null;

  if (active) {
    statusText = i18n.t('playlist.Now playing');
  } else if (status === 'watched') {
    statusText = i18n.t('playlist.Watched');
  } else if (watchedTime !== undefined) {
    statusText = i18n.t('playlist.In progress');
  }

  const statusId = `${id}-status`;

  if (statusText) {
    descriptionIds.push(statusId);
  }

  // The row selects the item on click, except when the user selects its text (e.g. to copy it) or clicks a link.
  // The status icon is the actual button, for the keyboard and the screen readers.
  const handleClick = (event: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('a')) {
      return;
    }

    const selection = globalThis.getSelection?.();

    // `detail` is 0 for a keyboard activation of the button, which always selects
    if (event.detail > 0 && selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) {
      return;
    }

    onClick(index);
  };

  const classes = ['qc-playlist-item'];

  if (active) {
    classes.push('qc-playlist-item--active');
  }

  if (status === 'watched') {
    classes.push('qc-playlist-item--watched');
  }

  return (
    <div id={id} class={classes.join(' ')} onClick={handleClick}>
      <button
        type="button"
        class="qc-playlist-item__button"
        aria-current={active ? 'true' : undefined}
        aria-describedby={descriptionIds.length ? descriptionIds.join(' ') : undefined}
      >
        <Icon name={statusIcons[status]} class="qc-playlist-item__status"/>
        <span class="qc-sr-only">{decodeEntities(presentation.title ?? '')}</span>
      </button>
      {leftSlot}
      {rightSlot}
      {statusText && <span id={statusId} class="qc-sr-only">{statusText}</span>}
    </div>
  );
}

/**
 * The row, only rendered again when its own props change, not on every time update of the player.
 * Not `memo()` of `preact/compat`: importing compat changes the event handling of the whole page's Preact, e.g. it
 * turns `onChange` into `onInput` on the inputs, which broke the seek bar
 */
export class PlaylistItemComponent extends Component<Props> {
  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    return (Object.keys(nextProps) as Array<keyof Props>).some((key) => nextProps[key] !== this.props[key]);
  }

  render(props: Readonly<Props>) {
    return <PlaylistItem {...props}/>;
  }
}
