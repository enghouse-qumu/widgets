import { render } from 'preact';
import { PresentationService } from '@/services/presentation.service';
import { ListConfigurationService, ResolvedListWidgetConfiguration } from '@/services/list-configuration.service';
import { ListWidgetConfiguration } from '@/interfaces/list-widget';
import { Presentation } from '@/interfaces/presentation';
import { ListComponent } from '@/components/list';
import { NotFoundComponent } from '@/components/not-found';
import { ListSkeletonComponent } from '@/components/list-skeleton';
import { createI18n } from '@/i18n';
import {
  ContainerAttributes,
  getContainer,
  getContainerAttributes,
  sendSourceWidgetTelemetry,
  setListStyleVariables,
  unmountWidget,
} from '@/utils/widget-container';
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
  private originalContainerAttributes: ContainerAttributes | null = null;
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
      unmountWidget(this.container, this.originalContainerAttributes);
      this.originalContainerAttributes = null;
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
    const container = getContainer(this.configuration.selector);

    createI18n(container, this.configuration.locales);

    this.container = container;
    this.originalContainerAttributes ??= getContainerAttributes(container);
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
    setListStyleVariables(container, this.configuration.widgetOptions.style);
  }

  private sendTelemetry() {
    sendSourceWidgetTelemetry(this.configuration, 'list');
  }
}

export default ListWidget;
