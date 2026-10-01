import { useState } from 'preact/hooks';
import { Presentation } from '@/interfaces/presentation';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { ResolvedListWidgetConfiguration } from '@/services/list-configuration.service';
import { ListItemComponent } from './list-item';
import { PlayerDialogComponent } from './dialog';

// Preact's `useId()` is only unique within a render root, and each widget is its own root: the ids are prefixed
// with a counter, plus a random part in case several copies of the library are loaded in the same page
const idNamespace = `qc-list-${crypto.randomUUID()}`;
let listCount = 0;

interface Props {
  playerParameters: Partial<PlayerParameters>;
  presentations: Presentation[];
  widgetOptions: ResolvedListWidgetConfiguration['widgetOptions'];
}

export function ListComponent({ presentations, playerParameters, widgetOptions }: Readonly<Props>) {
  const [selected, setSelected] = useState<Presentation | null>(null);
  const [listId] = useState(() => `${idNamespace}-${++listCount}`);

  const handleClick = (presentation: Presentation) => {
    if (widgetOptions.onItemClick) {
      widgetOptions.onItemClick(presentation);
    } else {
      setSelected(presentation);
    }
  };

  const aspectRatio = selected?.mediaDisplayWidth && selected?.mediaDisplayHeight
    ? `${selected.mediaDisplayWidth} / ${selected.mediaDisplayHeight}`
    : '16 / 9';

  return (
    <>
      {/* `role="list"`: Safari drops the list semantics with `list-style: none` */}
      <ul class={`qc-list qc-list--${widgetOptions.layout}`} role="list">
        {presentations.map((presentation, index) => (
          <li class="qc-list__item" key={presentation.guid}>
            <ListItemComponent
              id={`${listId}-${presentation.guid ?? index}`}
              item={widgetOptions.item}
              metadataStyle={widgetOptions.style.item?.metadata}
              playIconUrl={widgetOptions.playIconUrl}
              presentation={presentation}
              onClick={handleClick}
            />
          </li>
        ))}
      </ul>

      {selected && (
        <div class="qc-dialog" style={{ '--qc-pw-aspect-ratio': aspectRatio }}>
          <PlayerDialogComponent
            key={selected.guid}
            presentation={selected}
            playerParameters={playerParameters}
            widgetOptions={{ onIframeLoad: widgetOptions.onIframeLoad, playbackMode: 'modal' }}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </>
  );
}
