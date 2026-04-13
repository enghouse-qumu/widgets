import { render } from 'preact';
import { PresentationService } from '@/services/presentation.service';
import { ConfigurationService } from '@/services/configuration.service';
import { WidgetConfiguration } from '@/interfaces/widget-configuration';
import { Presentation } from '@/interfaces/presentation';
import { createI18n } from '@/i18n';
import 'virtual:svg-icons/register';
import { version } from '../../../../package.json' with { type: 'json' };
import './list-widget.scss';
import { List } from '@/components/list';
import { NotFoundComponent } from '@/components/not-found';

export class ListWidget {
  private readonly configurationService = new ConfigurationService();
  private readonly configuration: WidgetConfiguration;
  private readonly presentationService;
  private presentations: Presentation[] = [];
  private container: HTMLElement | null = null;
  private destroyed = false;

  get version(): string {
    return version;
  }

  static async create(
    configuration: WidgetConfiguration,
  ): Promise<ListWidget> {
    const widget = new ListWidget(configuration);

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
    this.presentations = [];
    this.destroyed = true;
  }

  private async init(): Promise<void> {
    try {
      this.presentations = await this.presentationService.getPresentations(
        this.configuration.guid,
        {
          sortBy: this.configuration.sortBy,
          sortOrder: this.configuration.sortOrder
        }
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

    this.container.classList.add('qc-widget', 'qc-list-widget', `qc-list-widget--${this.configuration.layout}`);

    this.setStyles(this.container);

    render(
      this.presentations.length ? (
        <List
          playerParameters={this.configuration.playerParameters}
          presentations={this.presentations}
          widgetOptions={this.configuration.widgetOptions}
        />
      ) : (
        <NotFoundComponent/>
      ),
      container
    );
  }

  private mapCssValue(key: string, value: string) {
    if (key === '--qc-pw-play-button-position') {
      const placeX = value.includes('left') ? 'start' : (value.includes('right') ? 'end' : 'center');
      const placeY = value.includes('top') ? 'start' : (value.includes('bottom') ? 'end' : 'center');

      return `${placeY} ${placeX}`;
    }

    return value;
  }

  private setStyles(container: HTMLElement) {
    const prefix = '--qc-pw';

    const toKebabCase = (str: string) => str
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();

    const walk = (obj: Record<string, any>, path: string[] = []) => {
      for (const [key, value] of Object.entries(obj)) {
        const nextPath = [...path, toKebabCase(key)];

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          walk(value, nextPath);
        } else if (value !== undefined && value !== null) {
          const cssVarName = `${prefix}-${nextPath.join('-')}`;

          container.style.setProperty(cssVarName, this.mapCssValue(cssVarName, value));
        }
      }
    };

    if (Object.keys(this.configuration.widgetOptions?.style || {}).length > 0) {
      walk(this.configuration.widgetOptions!.style!);
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
