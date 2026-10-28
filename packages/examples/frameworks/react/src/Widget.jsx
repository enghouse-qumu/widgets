import { useEffect, useRef } from 'react';
import { PresentationWidget } from '@qumu/widgets';
import '@qumu/widgets/presentation-widget.css';
import './widget.css';

export default function Widget({ configuration }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let widget;

    PresentationWidget
      .create({
        selector: containerRef.current,
        ...configuration,
      })
      .then((createdWidget) => {
        widget = createdWidget;
      });

    return () => widget?.destroy();
  }, [configuration]);

  return <div ref={containerRef}/>;
}
