import type { StoryObj } from '@storybook/web-components-vite';
import type { StoryContext } from 'storybook/internal/types';
import { PlayerSdk as QumuPlayerSdk } from '@qumu/player-sdk';
import { PresentationWidget } from 'lib';
import de from 'lib/locales/de.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/presentation-widget.css';
import { type Args, getPlaygroundConfigurationFromArgs } from './utils.ts';
import { version } from '../../../../../../package.json';

type Story = StoryObj;

export default {
  component: 'presentation-widget',
};

export const Basic: Story = {
  parameters: {
    docs: {
      source: {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`,
      },
    },
  },
  render: () => {
    const container = document.createElement('div');

    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: container,
    }).catch(console.error);

    return container;
  },
};

export const PlaybackThumbnail: Story = {
  parameters: {
    docs: {
      source: {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playbackMode: 'modal',
        },
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`,
      },
    },
  },
  render: () => {
    const container = document.createElement('div');

    container.style.display = 'grid';
    container.style.gap = '16px';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';

    const playbackWidget = document.createElement('div');

    const thumbnailWidget = document.createElement('div');


    container.appendChild(playbackWidget);
    container.appendChild(thumbnailWidget);

    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: playbackWidget,
      widgetOptions: {
        playbackMode: 'inline',
      },
    }).catch(console.error);

    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: thumbnailWidget,
      widgetOptions: {
        playbackMode: 'modal',
      },
    }).catch(console.error);

    return container;
  },
};

export const CustomPlayIcon: Story = {
  parameters: {
    docs: {
      source: {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playIconUrl: 'https://demo.qumucloud.com/widgets/resources/custom-play-icon.png',
          style: {
            playButton: {
              height: '48px',
              position: 'end start',
              width: '102px'
            },
          },
        },
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`,
      },
    },
  },
  render: () => {
    const container = document.createElement('div');

    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: container,
      widgetOptions: {
        playIconUrl: 'https://demo.qumucloud.com/widgets/resources/custom-play-icon.png',
        style: {
          playButton: {
            height: '48px',
            position: 'bottom-left',
            width: '102px',
          },
        },
      },
    })
      .catch(console.error);

    return container;
  },
};

export const PlayerSdk: Story = {
  parameters: {
    docs: {
      source: {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';
      import { PlayerSdk } from "https://unpkg.com/@qumu/player-sdk@3.3.2/dist/index.modern.mjs";

      PresentationWidget.create({
        host:'demo.qumucloud.com',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        selector: '#widget',
        widgetOptions: {
          onIframeLoad(iframe) {
            const logsEl = document.querySelector("#logs");

            const sdk = new PlayerSdk(iframe);

            sdk.addEventListener("timeupdate", (newTime) => {
              logsEl.innerHTML += \`<li>timeupdate: \${newTime}</li>\`;
            });

            sdk.getDuration().then((duration) => {
              logsEl.innerHTML += \`<li>duration: \${newTime}</li>\`;
            });
          },
        },
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`,
      },
    },
  },
  render: () => {
    // Create container elements
    const container = document.createElement('div');

    container.style.display = 'grid';
    container.style.gap = '16px';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';

    const widget = document.createElement('div');

    widget.style.width = '640px';
    widget.style.height = '360px';

    const logs = document.createElement('ul');

    logs.style.maxHeight = '360px';
    logs.style.overflowY = 'auto';
    logs.style.listStyle = 'none';
    logs.style.padding = '0';
    logs.style.margin = '0';
    logs.style.flex = '1';

    container.appendChild(widget);
    container.appendChild(logs);

    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: widget,
      widgetOptions: {
        onIframeLoad(iframe: HTMLIFrameElement) {
          const sdk = new QumuPlayerSdk(iframe);

          sdk.addEventListener('timeupdate', (newTime: number) => {
            logs.innerHTML += `<li>timeupdate: ${newTime}</li>`;
          });

          sdk.getDuration()
            .then((duration: number) => {
              logs.innerHTML += `<li>duration: ${duration}</li>`;
            })
            .catch(console.error);
        },
      },
    })
      .catch(console.error);

    return container;
  },
};

export const Playground: Story = {
  args: {
    /* eslint-disable sort-keys */
    host: 'demo.qumucloud.com',
    guid: 'JN6JHrg17xpwF8klXSIfFj',
    playbackMode: 'inline',
    /* eslint-enable sort-keys */
  },
  /* eslint-disable sort-keys */
  argTypes: {
    host: {
      control: 'text',
      table: {
        category: 'Configuration',
      },
    },
    guid: {
      control: 'text',
      table: {
        category: 'Configuration',
      },
    },
    playbackMode: {
      control: 'select',
      name: 'Playback Mode',
      options: [
        'inline',
        'inline-autoload',
        'inline-autoplay',
        'modal',
      ],
      table: {
        defaultValue: { summary: 'inline' },
        category: 'Configuration',
      },
    },
    playIconUrl: {
      control: 'text',
      name: 'Custom Play Icon URL',
      table: {
        category: 'Configuration',
      },
    },
    playerAudio: {
      control: 'text',
      name: 'Audio Language',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerCaptions: {
      control: 'text',
      name: 'Captions Language',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerConfigurationGuid: {
      control: 'text',
      name: 'Player Configuration Guid',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerDebug: {
      control: 'boolean',
      name: 'Enable Debug Mode',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerLoop: {
      control: 'boolean',
      name: 'Loop',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerQuality: {
      control: 'select',
      name: 'Quality',
      options: [
        'auto',
        'best',
        '1440p',
        '1080p',
        '720p',
        '360p',
        '240p',
      ],
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerReporting: {
      control: 'boolean',
      name: 'Enable Playback Analytics',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerReportingId: {
      control: 'text',
      name: 'Reporting ID',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerShowControlPanel: {
      control: 'boolean',
      name: 'Show the Control Panel',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerSidebar: {
      control: 'boolean',
      name: 'Show the Sidebar',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerStart: {
      control: 'text',
      name: 'Start at',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerView: {
      control: 'select',
      name: 'View',
      options: [
        'pipls',
        'pipss',
        'sbs',
      ],
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },
    playerVolume: {
      control: 'range',
      max: 100,
      min: 0,
      name: 'Volume',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters',
      },
    },

    // Style
    styleWidth: {
      control: 'text',
      name: 'Width',
      table: {
        category: 'Style',
        subcategory: 'Widget',
      },
    },
    styleHeight: {
      control: 'text',
      name: 'Height',
      table: {
        category: 'Style',
        subcategory: 'Widget',
      },
    },
    styleBorderRadius: {
      control: 'text',
      name: 'Border Radius',
      table: {
        category: 'Style',
        subcategory: 'Widget',
      },
    },

    stylePlayButtonBackgroundColor: {
      control: 'color',
      name: 'Background Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonColor: {
      control: 'color',
      name: 'Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonHoverBackgroundColor: {
      control: 'color',
      name: 'Background Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonHoverColor: {
      control: 'color',
      name: 'Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonActiveBackgroundColor: {
      control: 'color',
      name: 'Background Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonActiveColor: {
      control: 'color',
      name: 'Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonMargin: {
      control: 'text',
      name: 'Margin',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonPadding: {
      control: 'text',
      name: 'Padding',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonPosition: {
      control: 'select',
      name: 'Position',
      options: [
        'top-left',
        'top',
        'top-right',
        'left',
        'center',
        'right',
        'bottom-left',
        'bottom',
        'bottom-right',
      ],
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonHeight: {
      control: 'text',
      name: 'Height',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },
    stylePlayButtonWidth: {
      control: 'text',
      name: 'Width',
      table: {
        category: 'Style',
        subcategory: 'Play Button',
      },
    },

    styleThumbnailImageFit: {
      control: 'text',
      name: 'Image Fit',
      table: {
        category: 'Style',
        subcategory: 'Thumbnail',
      },
    },

    styleDialogBackdropColor: {
      control: 'color',
      name: 'Backdrop Color',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogBackgroundColor: {
      control: 'color',
      name: 'Background Color',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogBorder: {
      control: 'text',
      name: 'Border',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogBorderRadius: {
      control: 'text',
      name: 'Border Radius',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogMaxWidth: {
      control: 'text',
      name: 'Max Width',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogPadding: {
      control: 'text',
      name: 'Padding',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },
    styleDialogWidth: {
      control: 'text',
      name: 'Width',
      if: {
        arg: 'playbackMode',
        eq: 'modal',
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog',
      },
    },

    styleCloseButtonBackgroundColor: {
      control: 'color',
      name: 'Background Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonColor: {
      control: 'color',
      name: 'Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonHoverBackgroundColor: {
      control: 'color',
      name: 'Background Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonHoverColor: {
      control: 'color',
      name: 'Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonActiveBackgroundColor: {
      control: 'color',
      name: 'Background Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonActiveColor: {
      control: 'color',
      name: 'Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonBoxShadow: {
      control: 'text',
      name: 'Box Shadow',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonIconSize: {
      control: 'text',
      name: 'Icon Size',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },
    styleCloseButtonPadding: {
      control: 'text',
      name: 'Padding',
      table: {
        category: 'Style',
        subcategory: 'Close Button',
      },
    },

    styleNotFoundBackgroundColor: {
      control: 'color',
      name: 'Background Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found',
      },
    },
    styleNotFoundBorder: {
      control: 'text',
      name: 'Border',
      table: {
        category: 'Style',
        subcategory: 'Not Found',
      },
    },
    styleNotFoundColor: {
      control: 'color',
      name: 'Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found',
      },
    },
    styleNotFoundIconColor: {
      control: 'color',
      name: 'Icon Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found',
      },
    },
  },
  /* eslint-enable sort-keys */
  parameters: {
    docs: {
      source: {
        transform: (_: string, storyContext: StoryContext) => {
          const configuration = getPlaygroundConfigurationFromArgs(storyContext.args);

          return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';

      PresentationWidget.create(${
        JSON.stringify(configuration, null, 2)
          .split('\n')
          // add 6 spaces (indent level inside <script>)
          .map((line, i) => (i === 0 ? line : `      ${line}`))
          .join('\n')
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>
          `;
        },
      },
    },
  },
  render: (args: Partial<Args>) => {
    const container = document.createElement('div');

    PresentationWidget.create({
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt,
      },
      selector: container,
      ...getPlaygroundConfigurationFromArgs(args),
    }).catch(console.error);

    return container;
  },
};
