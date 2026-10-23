import { render } from 'preact';
import { PlayerSdk } from '@qumu/player-sdk';
import { PresentationService } from '@/services/presentation.service';
import {
  PlaylistConfigurationService,
  ResolvedPlaylistWidgetConfiguration,
} from '@/services/playlist-configuration.service';
import { ProgressService } from '@/services/progress.service';
import { PlaylistWidgetConfiguration } from '@/interfaces/playlist-widget';
import { Presentation } from '@/interfaces/presentation';
import { PlaylistApi, PlaylistComponent } from '@/components/playlist';
import { PlaylistSkeletonComponent } from '@/components/playlist-skeleton';
import { NotFoundComponent } from '@/components/not-found';
import { createI18n, useI18n } from '@/i18n';
import { positionToPlaceItems, setCssVariables } from '@/utils/css-variables';
import 'virtual:svg-icons/register';
import { version } from '../../../../package.json' with { type: 'json' };
import './playlist-widget.scss';

// the maximum number of ghost rows shown while loading
const SKELETON_MAX_ITEMS = 12;

export class PlaylistWidget {
  private readonly configurationService = new PlaylistConfigurationService();
  private readonly configuration: ResolvedPlaylistWidgetConfiguration;
  private readonly presentationService;
  private readonly apiRef: { current: PlaylistApi | null } = { current: null };
  private items: Presentation[] = [];
  private container: HTMLElement | null = null;
  // the attributes of the container before the widget, restored on destroy
  private originalContainerAttributes: Record<'aria-label' | 'class' | 'role' | 'style', string | null> | null = null;
  private destroyed = false;

  get version(): string {
    return version;
  }

  /**
   * The index of the current item, -1 when the playlist is empty
   */
  get currentIndex(): number {
    return this.apiRef.current?.currentIndex ?? -1;
  }

  get presentations(): Presentation[] {
    return [...this.items];
  }

  /**
   * The Player SDK of the current item's player; it changes with the item, and is undefined before the player is loaded
   */
  get playerSdk(): PlayerSdk | undefined {
    return this.apiRef.current?.playerSdk;
  }

  static async create(
    configuration: PlaylistWidgetConfiguration,
  ): Promise<PlaylistWidget> {
    const widget = new PlaylistWidget(configuration);

    // send telemetry if not disabled by the end user
    if (globalThis.window.__QUMU_WIDGET_TELEMETRY__ ?? true) {
      widget.sendTelemetry();
    }

    await widget.init();

    return widget;
  }

  constructor(
    initialConfiguration: PlaylistWidgetConfiguration,
  ) {
    this.configuration = this.configurationService.createConfiguration(initialConfiguration);
    this.presentationService = new PresentationService(this.configuration.source.host);
  }

  /**
   * Selects an item, by its index or its GUID, and plays it unless `play` is false
   */
  select(indexOrGuid: number | string, play = true): void {
    this.apiRef.current?.select(indexOrGuid, play);
  }

  next(): void {
    this.apiRef.current?.next();
  }

  previous(): void {
    this.apiRef.current?.previous();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    if (this.container) {
      // Unmount the widget properly, the current player's SDK is destroyed
      render(null, this.container);

      // Clear container HTML
      this.container.innerHTML = '';

      this.restoreContainerAttributes(this.container);
    }

    // Prevent future usage
    this.apiRef.current = null;
    this.items = [];
    this.destroyed = true;
  }

  private async init(): Promise<void> {
    // the container is ready, with the placeholders, while the presentations are loading
    this.prepareContainer();
    this.renderSkeleton();

    try {
      const { presentations } = await this.presentationService.getPresentations(this.configuration.source);

      this.items = presentations;
    } catch (err) {
      console.error(err);
    }

    if (!this.destroyed) {
      this.renderPresentations();
    }
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
      'aria-label': container.getAttribute('aria-label'),
      class: container.getAttribute('class'),
      role: container.getAttribute('role'),
      style: container.getAttribute('style'),
    };
    container.innerHTML = '';

    container.classList.add('qc-widget', 'qc-playlist-widget');

    if (!this.configuration.widgetOptions.showPlayer) {
      container.classList.add('qc-playlist-widget--hidden-player');
    }

    // a labelled region
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', useI18n().t('playlist.Playlist'));

    this.setStyles(container);
  }

  private renderSkeleton() {
    const { controls, item, showPlayer, style } = this.configuration.widgetOptions;

    render(
      <PlaylistSkeletonComponent
        controls={controls}
        count={Math.min(this.configuration.source.limit ?? SKELETON_MAX_ITEMS, SKELETON_MAX_ITEMS)}
        showPlayer={showPlayer}
        item={item}
        metadataStyle={style.item?.metadata}
      />,
      this.container!,
    );
  }

  private renderPresentations() {
    render(
      this.items.length ? (
        <PlaylistComponent
          apiRef={this.apiRef}
          configuration={this.configuration}
          presentations={this.items}
          progressService={new ProgressService(this.configuration.widgetOptions.trackProgress)}
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
      dialog,
      item,
      notFound,
      ...playlistStyle
    } = this.configuration.widgetOptions.style;
    // per-field styles are applied on each field element, see PlaylistItemComponent
    const { metadata: _metadata, ...itemStyle } = item ?? {};

    // the not found component is shared with the other widgets
    setCssVariables(container, { closeButton, dialog, notFound }, '--qc-pw');

    setCssVariables(container, { ...playlistStyle, item: itemStyle }, '--qc-plw', (name, value) => {
      switch (name) {
        case '--qc-plw-player-play-button-position':
          return positionToPlaceItems(String(value));
        case '--qc-plw-player-aspect-ratio':
          // accept both the "16:9" and the CSS "16 / 9" notations
          return String(value).replace(':', '/');
        default:
          return String(value);
      }
    });
  }

  // removes the classes, the attributes and the CSS custom properties set by the widget, and keeps those of the host page
  private restoreContainerAttributes(container: HTMLElement) {
    if (!this.originalContainerAttributes) {
      return;
    }

    Object.entries(this.originalContainerAttributes).forEach(([name, value]) => {
      if (value === null) {
        container.removeAttribute(name);
      } else {
        container.setAttribute(name, value);
      }
    });

    this.originalContainerAttributes = null;
  }

  private async sendTelemetry() {
    const { widgetOptions } = this.configuration;
    const telemetryConfig: any = {
      ...(this.configuration.playerParameters && Object.keys(this.configuration.playerParameters).length && { playerParameters: this.configuration.playerParameters }),
      source: this.configuration.source,
      type: 'playlist',
      version,
      widgetOptions: {
        ...widgetOptions,
        onIframeLoad: widgetOptions.onIframeLoad ? true : undefined,
        onItemChange: widgetOptions.onItemChange ? true : undefined,
        onPlaylistEnd: widgetOptions.onPlaylistEnd ? true : undefined,
      },
    };

    navigator.sendBeacon(`https://${this.configuration.source.host}/telemetry/widgets`, JSON.stringify(telemetryConfig));
  }
}

export default PlaylistWidget;
