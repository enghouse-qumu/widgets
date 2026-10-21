import type { StoryObj } from '@storybook/web-components-vite';
import type { StoryContext } from 'storybook/internal/types';
import { type Presentation, PlaylistWidget, type PlaylistWidgetConfiguration } from 'lib';
import de from 'lib/locales/de.json';
import en from 'lib/locales/en.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/playlist-widget.css';
import { type Args, argTypes, getHtmlSource, getPlaygroundConfigurationFromArgs } from './utils.ts';
import { playOneAtATime } from './exclusive-playback.ts';
import { version } from '../../../../../../package.json';

type Story = StoryObj;
type Configuration = Omit<PlaylistWidgetConfiguration, 'selector'>;

export default {
  component: 'playlist-widget',
};

const host = 'demo.qumucloud.com';

// the examples only show the presentations of a playlist dedicated to these docs
const docsPlaylistGuid = 'yKoSjaQV0l8y3RXQm1o9GD';

// the 12 presentations of the playlist, all shorter than 30 seconds
const presentationGuids = [
  'MpAKx9XnzxB9gTHeHmvtkS',
  'zLXb37rXK3OFWfXX073IGN',
  'r7S1ukfVHJS3ZwGQrbY9Yb',
  'laSY2N0H5ZjkihbGmM7k47',
  'WqfoJz4zM3WsGfu9iivGnd',
  'oNDKHPaGyAxZwQNVfQPIh0',
  'gmutumplJKLaX1E40zikRb',
  '5wznZejHImTxD6xtmlz1Py',
  'oDTf4p8h7FXfayBBNIUQEl',
  'LzfN9v8n6ZikDUNjUbZRJX',
  'c0gntNerXAWDLk53Rvd3mn',
  'JGScLtU7L5yZzrLiYostdv',
];

/**
 * Creates the widget in the container, with all the locales so the toolbar's locale switcher works.
 * Only one playlist of the page has a player at a time, see playOneAtATime(): it may be created again, the returned
 * function gives the current widget. `root` also contains the example's own controls
 */
function createPlaylist(configuration: Configuration, container: HTMLElement, root = container): () => Promise<PlaylistWidget> {
  // the widget inherits the font of the page, which Storybook does not set
  container.style.fontFamily = 'system-ui, sans-serif';
  // a comfortable size in the wide canvas of the docs
  container.style.maxWidth = '720px';

  return playOneAtATime(root, () => PlaylistWidget.create({
    locales: {
      de,
      en,
      es,
      fr,
      it,
      ja,
      pt,
    },
    selector: container,
    ...configuration,
  }));
}

/**
 * Renders the widget in a new container
 */
function renderPlaylist(configuration: Configuration, container = document.createElement('div')): HTMLElement {
  createPlaylist(configuration, container);

  return container;
}

/**
 * A story rendering the configuration, and showing it as the HTML source
 */
function example(configuration: Configuration): Story {
  return {
    parameters: {
      docs: {
        source: {
          code: getHtmlSource(configuration),
        },
      },
    },
    render: () => renderPlaylist(configuration),
  };
}

/**
 * A story with logs under the widget, and a hand-written HTML source since the callbacks cannot be serialized
 */
function exampleWithLogs(code: string, render: (container: HTMLElement, log: (message: string) => void) => void): Story {
  return {
    parameters: {
      docs: {
        source: {
          code,
        },
      },
    },
    render: () => {
      const container = document.createElement('div');
      const logs = document.createElement('ul');

      logs.style.margin = '16px 0 0';
      logs.style.fontFamily = 'ui-monospace, monospace';
      logs.style.fontSize = '13px';
      container.append(logs);

      render(container, (message) => {
        const item = document.createElement('li');

        item.textContent = message;
        logs.append(item);
      });

      return container;
    },
  };
}

export const Basic: Story = example({
  source: {
    host,
    limit: 6,
    smartSearchGuid: docsPlaylistGuid,
  },
});

export const HiddenPlayer: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 8),
  },
  widgetOptions: {
    showPlayer: false,
    style: {
      // the list takes the remaining height and scrolls
      height: '320px',
    },
  },
});

export const RowFields: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 4),
  },
  widgetOptions: {
    item: {
      info: {
        left: [
          { field: 'title' },
          { field: 'summary' },
        ],
        right: [
          {
            field: 'publishOn',
            label: false,
          },
          {
            field: 'duration',
            label: false,
          },
        ],
      },
    },
    style: {
      item: {
        metadata: {
          publishOn: {
            color: '#6b7280',
            fontSize: '12px',
          },
          // the rows show one line per field, the summary may take two
          summary: {
            color: '#6b7280',
            fontSize: '13px',
            lineClamp: 2,
          },
        },
        padding: '12px 16px',
      },
    },
  },
});

export const Styling: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(4, 12),
  },
  widgetOptions: {
    style: {
      borderRadius: '16px',
      controls: {
        backgroundColor: '#4338ca',
        buttons: {
          hoverBackgroundColor: 'rgb(255 255 255 / .2)',
        },
        menu: {
          activeColor: '#c7d2fe',
          backgroundColor: '#312e81',
        },
        padding: '10px 16px',
        timeline: {
          progressColor: '#fff',
          trackColor: 'rgb(255 255 255 / .35)',
        },
      },
      gap: '4px',
      // the list takes the remaining height and scrolls
      height: '560px',
      item: {
        activeBackgroundColor: '#e0e7ff',
        activeColor: '#3730a3',
        borderRadius: '8px',
        hoverBackgroundColor: '#eef2ff',
        metadata: {
          duration: {
            fontSize: '12px',
          },
          title: {
            fontWeight: '600',
          },
        },
        padding: '10px 14px',
        statusIconColor: '#4338ca',
        watchedColor: '#9ca3af',
      },
      list: {
        backgroundColor: '#f5f3ff',
      },
      player: {
        playButton: {
          backgroundColor: '#4338ca',
          hoverBackgroundColor: '#3730a3',
        },
      },
    },
  },
});

export const Events: Story = exampleWithLogs(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Playlist Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.css">
  </head>
  <body>
    <div id="widget"></div>
    <ul id="logs"></ul>

    <script type="module">
      import { PlaylistWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.js';

      const log = (message) => {
        const item = document.createElement('li');
        item.textContent = message;
        document.querySelector('#logs')?.append(item);
      };

      PlaylistWidget.create({
        selector: '#widget',
        source: {
          host: '${host}',
          presentationGuids: ${JSON.stringify(presentationGuids.slice(9, 12))},
        },
        widgetOptions: {
          trackProgress: false,
          onItemChange(presentation, index) {
            log(\`Item \${index}: \${presentation.title}\`);
          },
          onPlaylistEnd() {
            log('End of the playlist');
          },
        },
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`, (container, log) => {
  const widget = document.createElement('div');

  container.prepend(widget);
  renderPlaylist({
    source: {
      host,
      presentationGuids: presentationGuids.slice(9, 12),
    },
    widgetOptions: {
      onItemChange(presentation: Presentation, index: number) {
        log(`Item ${index}: ${presentation.title}`);
      },
      onPlaylistEnd() {
        log('End of the playlist');
      },
      trackProgress: false,
    },
  }, widget);
});

export const InstanceApi: Story = exampleWithLogs(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Playlist Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.css">
  </head>
  <body>
    <div id="widget"></div>
    <button id="previous">Previous</button>
    <button id="next">Next</button>
    <button id="last">Play the last one</button>
    <button id="restart">Restart the current one</button>

    <script type="module">
      import { PlaylistWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.js';

      const widget = await PlaylistWidget.create({
        selector: '#widget',
        source: {
          host: '${host}',
          presentationGuids: ${JSON.stringify(presentationGuids.slice(0, 4))},
        },
      });

      document.querySelector('#previous').addEventListener('click', () => widget.previous());
      document.querySelector('#next').addEventListener('click', () => widget.next());
      // by index, or by GUID
      document.querySelector('#last').addEventListener('click', () => widget.select(widget.presentations.length - 1));
      // the Player SDK of the current item, undefined until its player is loaded
      document.querySelector('#restart').addEventListener('click', () => widget.playerSdk?.setCurrentTime(0));
    </script>
  </body>
</html>`, (container, log) => {
  const element = document.createElement('div');
  const buttons = document.createElement('div');

  buttons.style.display = 'flex';
  buttons.style.gap = '8px';
  buttons.style.margin = '16px 0 0';
  container.prepend(element, buttons);

  // the buttons of the example also play the playlist
  const getWidget = createPlaylist({
    source: {
      host,
      presentationGuids: presentationGuids.slice(0, 4),
    },
  }, element, container);

  const addButton = (label: string, action: (widget: PlaylistWidget) => void) => {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      getWidget()
        .then((widget) => {
          action(widget);
          log(`${label}: current item ${widget.currentIndex}`);
        })
        .catch(console.error);
    });
    buttons.append(button);
  };

  addButton('Previous', (widget) => widget.previous());
  addButton('Next', (widget) => widget.next());
  addButton('Play the last one', (widget) => widget.select(widget.presentations.length - 1));
  addButton('Restart the current one', (widget) => widget.playerSdk?.setCurrentTime(0));
});

export const Playground: Story = {
  // the order of the args is the order of the controls, the data source first
  /* eslint-disable sort-keys */
  args: {
    source: 'smartSearchGuid',
    host,
    smartSearchGuid: docsPlaylistGuid,
    presentationGuids: presentationGuids.join(', '),
    searchMatch: 'all',
    searchField: 'title',
    searchComparator: 'contains',
    searchValue: 'the',
  },
  /* eslint-enable sort-keys */
  argTypes,
  parameters: {
    docs: {
      source: {
        transform: (_: string, storyContext: StoryContext) => getHtmlSource(getPlaygroundConfigurationFromArgs(storyContext.args)),
      },
    },
  },
  render: (args: Partial<Args>) => renderPlaylist(getPlaygroundConfigurationFromArgs(args)),
};
