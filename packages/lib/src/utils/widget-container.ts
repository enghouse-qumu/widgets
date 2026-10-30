import { render } from 'preact';
import { ListWidgetSource } from '@/interfaces/list-widget-source';
import { ListWidgetStyle } from '@/interfaces/list-widget-style';
import { PlayerParameters } from '@/interfaces/player-parameters';
import { maxColumnsTemplate, positionToPlaceItems, setCssVariables } from '@/utils/css-variables';
import { version } from '../../../../package.json' with { type: 'json' };

// the class and style attributes of the container before the widget, restored on destroy
export interface ContainerAttributes {
  className: string;
  style: string | null;
}

/**
 * The element of the widget, from the `selector` of the configuration
 */
export function getContainer(selector: string | HTMLElement): HTMLElement {
  if (selector instanceof HTMLElement) {
    return selector;
  }

  const container = document.querySelector<HTMLElement>(selector);

  if (!container) {
    throw new Error(`Element for selector "${selector}" not found`);
  }

  return container;
}

export function getContainerAttributes(container: HTMLElement): ContainerAttributes {
  return {
    className: container.className,
    style: container.getAttribute('style'),
  };
}

/**
 * Unmounts the widget and removes the classes and the CSS custom properties it set, keeping those of the host page
 */
export function unmountWidget(container: HTMLElement, attributes: ContainerAttributes | null) {
  render(null, container);
  container.innerHTML = '';

  if (!attributes) {
    return;
  }

  container.className = attributes.className;

  if (attributes.style === null) {
    container.removeAttribute('style');
  } else {
    container.setAttribute('style', attributes.style);
  }
}

/**
 * Sets the style of the widgets showing list items (ListWidget, CarouselWidget) as CSS custom properties: the layout
 * and the items as `--qc-lw-*`, the components shared with the PresentationWidget as `--qc-pw-*`
 */
export function setListStyleVariables(container: HTMLElement, style: Partial<ListWidgetStyle>) {
  const {
    closeButton,
    columns,
    dialog,
    item,
    notFound,
    ...listStyle
  } = style;
  // per-field styles are applied on each field element, see ListItemComponent
  const itemStyle = { ...item };

  delete itemStyle.metadata;

  // the dialog, close button and not found components are shared with the PresentationWidget
  setCssVariables(container, {
    closeButton,
    dialog,
    notFound,
  }, '--qc-pw');

  setCssVariables(container, {
    ...listStyle,
    item: itemStyle,
  }, '--qc-lw', (name, value) => {
    switch (name) {
      case '--qc-lw-item-play-button-position':
      case '--qc-lw-item-duration-badge-position':
        return positionToPlaceItems(String(value));
      case '--qc-lw-item-thumbnail-aspect-ratio':
        // accept both the "16:9" and the CSS "16 / 9" notations
        return String(value).replace(':', '/');
      default:
        return String(value);
    }
  });

  if (typeof columns === 'number') {
    container.style.setProperty('--qc-lw-grid-template-columns', maxColumnsTemplate(columns));
  }
}

interface SourceWidgetConfiguration {
  playerParameters?: Partial<PlayerParameters>;
  source: ListWidgetSource;
  widgetOptions: {
    onIframeLoad?: unknown;
    onItemClick?: unknown;
  };
}

/**
 * Sends the configuration of a widget fetching a source (ListWidget, CarouselWidget), the callbacks as booleans
 */
export function sendSourceWidgetTelemetry(configuration: SourceWidgetConfiguration, type: string) {
  const { playerParameters, source, widgetOptions } = configuration;
  const telemetryConfig = {
    ...(playerParameters && Object.keys(playerParameters).length && { playerParameters }),
    source,
    type,
    version,
    widgetOptions: {
      ...widgetOptions,
      onIframeLoad: widgetOptions.onIframeLoad ? true : undefined,
      onItemClick: widgetOptions.onItemClick ? true : undefined,
    },
  };

  navigator.sendBeacon(`https://${source.host}/telemetry/widgets`, JSON.stringify(telemetryConfig));
}
