import { useEffect, useRef, useState } from 'preact/hooks';
import { WidgetOptions } from '@/interfaces/widget-options';
import { Presentation } from '@/interfaces/presentation';
import { ThumbnailComponent } from './thumbnail';
import { PlayerComponent } from './player';
import { PlayerParameters } from '@/interfaces/player-parameters';
import Icon from '@/components/icon';

interface Props {
  presentation: Presentation;
  playerParameters: Partial<PlayerParameters>;
  widgetOptions: Partial<WidgetOptions>;
}

export function DialogComponent({ presentation, widgetOptions, playerParameters }: Readonly<Props>) {
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!showDialog) {
      return;
    }

    dialogRef.current?.showModal();

    // Set the private property for the modal
    dialogRef.current!.style.setProperty(
      '--_qc-pw-dialog-border-width',
      getComputedStyle(dialogRef.current!).borderWidth,
    );

    // TODO necessary for the List widget see if we can improve that
    const aspectRatio = presentation?.mediaDisplayWidth && presentation?.mediaDisplayHeight
      ? `${presentation.mediaDisplayWidth} / ${presentation.mediaDisplayHeight}`
      : '16 / 9';

    dialogRef.current!.style.setProperty('--qc-pw-aspect-ratio', aspectRatio);
  }, [showDialog]);

  const closeDialog = () => {
    dialogRef.current?.close();
    setShowDialog(false);
  };

  if (!presentation) {
    return '';
  }

  return (
    <div class="qc-dialog">
      <ThumbnailComponent
        onClick={() => setShowDialog(true)}
        presentation={presentation}
        widgetOptions={widgetOptions}
      />

      {showDialog && (
        <dialog
          ref={dialogRef}
          onClick={(e) => {
            if (e.target === dialogRef.current) {
              closeDialog();
            }
          }}
          onClose={() => setShowDialog(false)}
        >
          <button
            type="button"
            class="qc-dialog__close-button"
            onClick={closeDialog}
          >
            <Icon name="close"/>
          </button>
          <PlayerComponent
            presentation={presentation}
            playerParameters={playerParameters}
            widgetOptions={widgetOptions}
          />
        </dialog>
      )}
    </div>
  );
}
