import { render } from 'preact';
import { PresentationService } from '@/services/presentation.service';
import { CarouselConfigurationService, ResolvedCarouselWidgetConfiguration } from '@/services/carousel-configuration.service';
import { CarouselWidgetConfiguration } from '@/interfaces/carousel-widget';
import { Presentation } from '@/interfaces/presentation';
import { CarouselComponent } from '@/components/carousel';
import { NotFoundComponent } from '@/components/not-found';
import { ListSkeletonComponent } from '@/components/list-skeleton';
import { createI18n } from '@/i18n';
import { setCssVariables } from '@/utils/css-variables';
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
import './carousel-widget.scss';

// the maximum number of ghost items shown while loading, the ones beyond the first page are hidden
const SKELETON_MAX_ITEMS = 12;

export class CarouselWidget {
  private readonly configurationService = new CarouselConfigurationService();
  private readonly configuration: ResolvedCarouselWidgetConfiguration;
  private readonly presentationService;
  private presentations: Presentation[] = [];
  private container: HTMLElement | null = null;
  private originalContainerAttributes: ContainerAttributes | null = null;
  private destroyed = false;

  get version(): string {
    return version;
  }

  static async create(
    configuration: CarouselWidgetConfiguration,
  ): Promise<CarouselWidget> {
    const widget = new CarouselWidget(configuration);

    // send telemetry if not disabled by the end user
    if (globalThis.window.__QUMU_WIDGET_TELEMETRY__ ?? true) {
      widget.sendTelemetry();
    }

    await widget.init();

    return widget;
  }

  constructor(
    initialConfiguration: CarouselWidgetConfiguration,
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

  private get isMultiItem(): boolean {
    return this.configuration.widgetOptions.playbackMode === 'modal';
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

    // destroyed while loading
    if (!this.destroyed) {
      this.renderPresentations();
    }
  }

  private prepareContainer() {
    const container = getContainer(this.configuration.selector);

    createI18n(container, this.configuration.locales);

    this.container = container;
    this.originalContainerAttributes ??= getContainerAttributes(container);
    container.innerHTML = '';

    this.container.classList.add('qc-widget', 'qc-carousel-widget', `qc-carousel-widget--${this.isMultiItem ? 'multi' : 'single'}`);

    this.setStyles(this.container);
  }

  private renderSkeleton() {
    const { item, style } = this.configuration.widgetOptions;
    const count = this.isMultiItem ? Math.min(this.configuration.source.limit ?? SKELETON_MAX_ITEMS, SKELETON_MAX_ITEMS) : 1;

    render(
      <ListSkeletonComponent
        count={count}
        item={item}
        layout="grid"
        metadataStyle={style.item?.metadata}
      />,
      this.container!,
    );
  }

  private renderPresentations() {
    render(
      this.presentations.length ? (
        <CarouselComponent
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
      arrows,
      dots,
      transitionDuration,
      ...listStyle
    } = this.configuration.widgetOptions.style;
    // the arrows position and the dots placement are classes, see CarouselComponent
    const { position: _arrowsPosition, ...arrowsStyle } = arrows ?? {};
    const { placement: _dotsPlacement, ...dotsStyle } = dots ?? {};

    // the layout and the items are shared with the ListWidget. The items per page are computed by the carousel,
    // `columns` only limits the ghost items to the first page
    setListStyleVariables(container, listStyle);

    setCssVariables(container, {
      arrows: arrowsStyle,
      dots: dotsStyle,
      transitionDuration,
    }, '--qc-cw');
  }

  private sendTelemetry() {
    sendSourceWidgetTelemetry(this.configuration, 'carousel');
  }
}

export default CarouselWidget;
