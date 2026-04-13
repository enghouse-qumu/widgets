import { Presentation } from '@/interfaces/presentation';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { WidgetOptions } from '@/interfaces/widget-options';
import { DialogComponent } from '@/components/dialog';

interface Props {
  presentations: Presentation[];
  playerParameters: Partial<PlayerParameters>;
  widgetOptions: Partial<WidgetOptions>;
}

export function List({ presentations, widgetOptions, playerParameters }: Readonly<Props>) {
  return (
    <>
      {presentations.map((presentation) => (
        <div class="qc-list-item">
          <DialogComponent
            key={presentation.guid} // make sure this is a unique field
            presentation={presentation}
            widgetOptions={widgetOptions}
            playerParameters={playerParameters}
          />
          <div>
            {presentation.title}
          </div>
        </div>
      ))}
    </>
  );
}
