import { render } from 'preact';
import { PresentationService } from '@/services/presentation.service';
import { ConfigurationService } from '@/services/configuration.service';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';
import { Presentation } from '@/interfaces/presentation';
import { DialogComponent } from '@/components/dialog';
import { PlayerComponent } from '@/components/player';
import { NotFoundComponent } from '@/components/not-found';
import { createI18n } from '@/i18n';
import { positionToPlaceItems, setCssVariables } from '@/utils/css-variables';
import 'virtual:svg-icons/register';
import { version } from '../../../../package.json' with { type: 'json' };
import './presentation-widget.scss';

export class PresentationWidget {
  private readonly configurationService = new ConfigurationService();
  private readonly configuration: WidgetConfiguration;
  private readonly presentationService;
  private presentation: Presentation | null = null;
  private container: HTMLElement | null = null;
  private destroyed = false;

  get version(): string {
    return version;
  }

  static async create(
    configuration: WidgetConfiguration,
  ): Promise<PresentationWidget> {
    const widget = new PresentationWidget(configuration);

    // send telemetry if not disabled by the end user
    if (globalThis.window.__QUMU_WIDGET_TELEMETRY__ ?? true) {
      widget.sendTelemetry()
    }

    await widget.init();

    return widget;
  }

  constructor(
    initialConfiguration: WidgetConfiguration,
  ) {
    this.configuration = this.configurationService.createConfiguration(initialConfiguration);
    this.presentationService = new PresentationService(this.configuration.host);
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
    }

    // Prevent future usage
    this.presentation = null;
    this.destroyed = true;
  }

  private async init(): Promise<void> {
    try {
      this.presentation = await this.presentationService.getPresentation(
        this.configuration.guid,
        this.configuration.sortBy,
        this.configuration.sortOrder
      );
    } catch (err) {
      console.error(err);
    } finally {
      this.mount();
    }
  }

  private mount() {
    const container = this.configuration.selector instanceof HTMLElement
      ? this.configuration.selector
      : document.querySelector<HTMLElement>(this.configuration.selector);

    if (!container) {
      throw new Error(`Element for selector "${this.configuration.selector}" not found`);
    }

    createI18n(container, this.configuration.locales);

    this.container = container;
    container.innerHTML = '';

    const aspectRatio = this.presentation?.mediaDisplayWidth && this.presentation?.mediaDisplayHeight
      ? `${this.presentation.mediaDisplayWidth} / ${this.presentation.mediaDisplayHeight}`
      : '16 / 9';

    this.container.classList.add('qc-widget', 'qc-presentation-widget');
    this.container.style.setProperty('--qc-pw-aspect-ratio', aspectRatio);

    this.setStyles(this.container);

    render(
      this.presentation ? (
        this.configuration.widgetOptions?.playbackMode === 'modal' ? (
          <DialogComponent
            presentation={this.presentation}
            playerParameters={this.configuration.playerParameters!}
            widgetOptions={this.configuration.widgetOptions!}
          />
        ) : (
          <PlayerComponent
            presentation={this.presentation}
            playerParameters={this.configuration.playerParameters!}
            widgetOptions={this.configuration.widgetOptions!}
          />
        )
      ) : (
        <NotFoundComponent/>
      ),
      container
    );
  }

  private setStyles(container: HTMLElement) {
    const style = this.configuration.widgetOptions?.style;

    if (style && Object.keys(style).length > 0) {
      setCssVariables(container, style, '--qc-pw', (name, value) => (
        name === '--qc-pw-play-button-position' ? positionToPlaceItems(String(value)) : String(value)
      ));
    }
  }

  private async sendTelemetry() {
    const telemetryConfig: any = {
      guid: this.configuration.guid,
      host: this.configuration.host,
      ...(this.configuration.playerParameters && Object.keys(this.configuration.playerParameters).length && { playerParameters: this.configuration.playerParameters }),
      sortBy: this.configuration.sortBy,
      sortOrder: this.configuration.sortOrder,
      type: 'presentation',
      version,
      widgetOptions: {
        ...this.configuration.widgetOptions,
        onIframeLoad: this.configuration.widgetOptions?.onIframeLoad ? true : undefined,
        onThumbnailClick: this.configuration.widgetOptions?.onThumbnailClick ? true : undefined,
      }
    };

    navigator.sendBeacon(`https://${this.configuration.host}/telemetry/widgets`, JSON.stringify(telemetryConfig));
  }
}

export default PresentationWidget;
