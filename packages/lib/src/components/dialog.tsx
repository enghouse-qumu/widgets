import { useEffect, useRef, useState } from 'preact/hooks';
import { WidgetOptions } from '@/interfaces/widget-options';
import { Presentation } from '@/interfaces/presentation';
import { ThumbnailComponent } from './thumbnail';
import { PlayerComponent } from './player';
import { PlayerParameters } from '@/interfaces/player-parameters';
import Icon from '@/components/icon';
import { useI18n } from '@/i18n';
import { decodeEntities } from '@/utils/presentation-fields';

interface Props {
  presentation: Presentation;
  playerParameters: Partial<PlayerParameters>;
  widgetOptions: Partial<WidgetOptions>;
}

interface PlayerDialogProps extends Props {
  onClose(): void;
}

/**
 * The modal dialog with the player, opened as soon as it is mounted
 */
export function PlayerDialogComponent({ presentation, widgetOptions, playerParameters, onClose }: Readonly<PlayerDialogProps>) {
  const i18n = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();

    // Set the private property for the modal
    dialogRef.current!.style.setProperty(
      '--_qc-pw-dialog-border-width',
      getComputedStyle(dialogRef.current!).borderWidth,
    );
  }, []);

  // `onClose` is called from the native `close` event, fired by `close()` as well as by the Escape key
  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={decodeEntities(presentation.title ?? '')}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          closeDialog();
        }
      }}
      onClose={onClose}
    >
      <button
          type="button"
          class="qc-dialog__close-button"
          aria-label={i18n.t('common.Close')}
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
  );
}

export function DialogComponent({ presentation, widgetOptions, playerParameters }: Readonly<Props>) {
  const [showDialog, setShowDialog] = useState(false);

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
        <PlayerDialogComponent
          presentation={presentation}
          playerParameters={playerParameters}
          widgetOptions={widgetOptions}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
