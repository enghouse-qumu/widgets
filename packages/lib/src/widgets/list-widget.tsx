import { render } from 'preact';
import { PresentationService } from '@/services/presentation.service';
import { ListConfigurationService, ResolvedListWidgetConfiguration } from '@/services/list-configuration.service';
import { ListWidgetConfiguration } from '@/interfaces/list-widget';
import { Presentation } from '@/interfaces/presentation';
import { ListComponent } from '@/components/list';
import { NotFoundComponent } from '@/components/not-found';
import { ListSkeletonComponent } from '@/components/list-skeleton';
import { createI18n } from '@/i18n';
import { positionToPlaceItems, setCssVariables } from '@/utils/css-variables';
import 'virtual:svg-icons/register';
import { version } from '../../../../package.json' with { type: 'json' };
import './list-widget.scss';

// the maximum number of ghost items shown while loading
const SKELETON_MAX_ITEMS = 12;

export class ListWidget {
  private readonly configurationService = new ListConfigurationService();
  private readonly configuration: ResolvedListWidgetConfiguration;
  private readonly presentationService;
  private presentations: Presentation[] = [];
  private container: HTMLElement | null = null;
  // the class and style attributes of the container before the widget, restored on destroy
  private originalContainerAttributes: { className: string; style: string | null } | null = null;
  private destroyed = false;

  get version(): string {
    return version;
  }

  static async create(
    configuration: ListWidgetConfiguration,
  ): Promise<ListWidget> {
    const widget = new ListWidget(configuration);

    // send telemetry if not disabled by the end user
    if (globalThis.window.__QUMU_WIDGET_TELEMETRY__ ?? true) {
      widget.sendTelemetry();
    }

    await widget.init();

    return widget;
  }

  constructor(
    initialConfiguration: ListWidgetConfiguration,
  ) {
    this.configuration = this.configurationService.createConfiguration(initialConfiguration);
    this.presentationService = new PresentationService(this.configuration.source.host);
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    if (this.container) {
      // Unmount the widget properly
      render(null, this.container);

      // Clear container HTML
      this.container.innerHTML = '';

      this.restoreContainerAttributes(this.container);
    }

    // Prevent future usage
    this.presentations = [];
    this.destroyed = true;
  }

  private async init(): Promise<void> {
    // the container is ready, with the ghost items, while the presentations are loading
    this.prepareContainer();
    this.renderSkeleton();

    try {
      const { presentations } = await this.presentationService.getPresentations(this.configuration.source);

      this.presentations = presentations;
    } catch (err) {
      console.error(err);
    }

    this.renderPresentations();
  }

  private prepareContainer() {
    const container = this.configuration.selector instanceof HTMLElement
      ? this.configuration.selector
      : document.querySelector<HTMLElement>(this.configuration.selector);

    if (!container) {
      throw new Error(`Element for selector "${this.configuration.selector}" not found`);
    }

    createI18n(container, this.configuration.locales);

    this.container = container;
    this.originalContainerAttributes ??= {
      className: container.className,
      style: container.getAttribute('style'),
    };
    container.innerHTML = '';

    this.container.classList.add('qc-widget', 'qc-list-widget', `qc-list-widget--${this.configuration.widgetOptions.layout}`);

    this.setStyles(this.container);
  }

  private renderSkeleton() {
    const { item, layout } = this.configuration.widgetOptions;

    render(
      <ListSkeletonComponent
        count={Math.min(this.configuration.source.limit ?? SKELETON_MAX_ITEMS, SKELETON_MAX_ITEMS)}
        item={item}
        layout={layout}
        metadataStyle={this.configuration.widgetOptions.style.item?.metadata}
      />,
      this.container!,
    );
  }

  private renderPresentations() {
    render(
      this.presentations.length ? (
        <ListComponent
          presentations={this.presentations}
          playerParameters={this.configuration.playerParameters!}
          widgetOptions={this.configuration.widgetOptions}
        />
      ) : (
        <NotFoundComponent message="list.No presentations found"/>
      ),
      this.container!,
    );
  }

  private setStyles(container: HTMLElement) {
    const {
      closeButton,
      columns,
      dialog,
      item,
      notFound,
      ...listStyle
    } = this.configuration.widgetOptions.style;
    // per-field styles are applied on each field element, see ListItemComponent
    const { metadata: _metadata, ...itemStyle } = item ?? {};

    // the dialog, close button and not found components are shared with the PresentationWidget
    setCssVariables(container, { closeButton, dialog, notFound }, '--qc-pw');

    setCssVariables(container, { ...listStyle, item: itemStyle }, '--qc-lw', (name, value) => {
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
      // `columns` is a maximum, `minItemWidth` has priority: the column minimum is the widest of `minItemWidth`
      // and the width of 1/N of the row, so at most N columns fit and fewer when the items would be too narrow.
      // The percentages resolve against the list, where the custom property is used.
      const maxColumnWidth = `(100% - ${columns - 1} * var(--qc-lw-gap)) / ${columns}`;

      container.style.setProperty(
        '--qc-lw-grid-template-columns',
        `repeat(auto-fill, minmax(min(max(var(--qc-lw-min-item-width), ${maxColumnWidth}), 100%), 1fr))`,
      );
    }
  }

  // removes the classes and the CSS custom properties set by the widget, and keeps those of the host page
  private restoreContainerAttributes(container: HTMLElement) {
    if (!this.originalContainerAttributes) {
      return;
    }

    const { className, style } = this.originalContainerAttributes;

    container.className = className;

    if (style === null) {
      container.removeAttribute('style');
    } else {
      container.setAttribute('style', style);
    }

    this.originalContainerAttributes = null;
  }

  private async sendTelemetry() {
    const { widgetOptions } = this.configuration;
    const telemetryConfig: any = {
      ...(this.configuration.playerParameters && Object.keys(this.configuration.playerParameters).length && { playerParameters: this.configuration.playerParameters }),
      source: this.configuration.source,
      type: 'list',
      version,
      widgetOptions: {
        ...widgetOptions,
        onIframeLoad: widgetOptions.onIframeLoad ? true : undefined,
        onItemClick: widgetOptions.onItemClick ? true : undefined,
      },
    };

    navigator.sendBeacon(`https://${this.configuration.source.host}/telemetry/widgets`, JSON.stringify(telemetryConfig));
  }
}

export default ListWidget;
