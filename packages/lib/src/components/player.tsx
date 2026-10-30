import { useEffect, useRef, useState } from 'preact/hooks';
import { Presentation } from '@/interfaces/presentation';
import { WidgetOptions } from '@/interfaces/widget-options';
import { ThumbnailComponent } from './thumbnail';
import { decodeEntities } from '@/utils/presentation-fields';
import { PlayerParameters } from '@/interfaces/player-parameters';

// Each player iframe gets a unique URL. The Player SDK finds the iframe of a player from the URL the player announces,
// so two iframes of the same presentation would be mixed up, and the SDK of the second one would never connect.
// The ids are prefixed with a random part in case several copies of the library are loaded in the same page
const playerIdNamespace = Math.random().toString(36).slice(2, 8);
let playerCount = 0;

interface Props {
  presentation: Presentation;
  playerParameters: Partial<PlayerParameters>;
  widgetOptions: Partial<WidgetOptions>;
}

export function PlayerComponent({ presentation, widgetOptions, playerParameters }: Readonly<Props>) {
  const [showIframe, setShowIframe] = useState(['inline-autoload', 'inline-autoplay', 'modal'].includes(widgetOptions.playbackMode!));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerId] = useState(() => `${playerIdNamespace}-${++playerCount}`);

  useEffect(() => {
    if (!showIframe || !iframeRef.current) {
      return;
    }

    const iframe = iframeRef.current;

    const handleLoad = () => {
      widgetOptions.onIframeLoad?.(iframe);
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [showIframe]);

  const url = new URL(presentation.player || '');
  const autoplay = ['inline-autoplay', 'inline', 'modal'].includes(widgetOptions.playbackMode!);

  url.searchParams.set('autoplay', autoplay.toString());

  Object.entries(playerParameters).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  // ignored by the player, see `playerIdNamespace`
  url.searchParams.set('qcPlayerId', playerId);

  const iframe = (
    <iframe
        ref={iframeRef}
        src={url.toString()}
        width="100%"
        height="100%"
        allow="autoplay; fullscreen"
        title={decodeEntities(presentation.title ?? '')}
        class="qc-player"
    />
  );

  const thumbnail = (
    <ThumbnailComponent
        presentation={presentation}
        onClick={() => setShowIframe(true)}
        widgetOptions={widgetOptions}
    />
  );

  return showIframe ? iframe : thumbnail;
}
