import type { StoryObj } from '@storybook/web-components-vite';
import type { StoryContext } from 'storybook/internal/types';
import { CarouselWidget, type CarouselWidgetConfiguration, type Presentation } from 'lib';
import de from 'lib/locales/de.json';
import en from 'lib/locales/en.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/carousel-widget.css';
import { type Args, argTypes, getHtmlSource, getPlaygroundConfigurationFromArgs } from './utils.ts';
import { nextIcon, playIcon, previousIcon } from '../icons.ts';
import { version } from '../../../../../../package.json';

type Story = StoryObj;
type Configuration = Omit<CarouselWidgetConfiguration, 'selector'>;

export default {
  component: 'carousel-widget',
};

const host = 'demo.qumucloud.com';

// the examples only show the presentations of a playlist dedicated to these docs
const docsPlaylistGuid = 'yKoSjaQV0l8y3RXQm1o9GD';
// a Yes/No metadata field, set to Yes on each presentation of the playlist
const docsMetadataGuid = '7ujlJU5I4Jx60ZLGlrrhDo';

// the 12 presentations of the playlist
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
 * Renders the widget in a new container, with all the locales so the toolbar's locale switcher works
 */
function renderCarousel(configuration: Configuration, container = document.createElement('div')): HTMLElement {
  // the widget inherits the font of the page, which Storybook does not set
  container.style.fontFamily = 'system-ui, sans-serif';

  CarouselWidget.create({
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
  }).catch(console.error);

  return container;
}

/**
 * A story rendering the configuration, and showing it as the HTML source
 */
/**
 * @param configuration the configuration of the widget
 * @param containerStyle the style of the container in the docs, e.g. room for the shadow of the items
 */
function example(configuration: Configuration, containerStyle: Partial<CSSStyleDeclaration> = {}): Story {
  return {
    parameters: {
      docs: {
        source: {
          code: getHtmlSource(configuration),
        },
      },
    },
    render: () => {
      const container = document.createElement('div');

      Object.assign(container.style, containerStyle);

      return renderCarousel(configuration, container);
    },
  };
}

export const Basic: Story = example({
  source: {
    host,
    smartSearchGuid: docsPlaylistGuid,
  },
});

// the inline modes show a single item per page, the docs keep it to a comfortable width
const singleItemStyle = {
  width: 'min(100%, 720px)',
};

export const Inline: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 5),
  },
  widgetOptions: {
    playbackMode: 'inline',
    style: singleItemStyle,
  },
});

export const InlineAutoload: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(5, 9),
  },
  widgetOptions: {
    playbackMode: 'inline-autoload',
    style: singleItemStyle,
  },
});

export const InlineAutoplay: Story = example({
  // muted, so the docs page stays quiet
  playerParameters: {
    volume: 0,
  },
  source: {
    host,
    presentationGuids: presentationGuids.slice(9, 12),
  },
  widgetOptions: {
    playbackMode: 'inline-autoplay',
    style: singleItemStyle,
  },
});

export const DotsOnly: Story = example({
  source: {
    host,
    presentationGuids,
  },
  widgetOptions: {
    navigation: {
      arrows: false,
    },
  },
});

export const ArrowsOnly: Story = example({
  source: {
    host,
    presentationGuids,
  },
  widgetOptions: {
    navigation: {
      dots: false,
    },
  },
});

export const InfoFields: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 8),
  },
  widgetOptions: {
    item: {
      info: {
        bottom: [
          { field: 'title' },
          {
            field: 'duration',
            label: 'Length',
          },
          {
            field: 'publishOn',
            label: false,
          },
        ],
        top: [
          {
            field: 'publisher',
            label: 'Presented by',
          },
        ],
      },
      showDurationOverlay: false,
    },
  },
});

export const Columns: Story = example({
  source: {
    host,
    presentationGuids,
  },
  widgetOptions: {
    style: {
      columns: 4,
      minItemWidth: '160px',
    },
  },
});

// white tiles with a soft shadow, the custom play icon of the list widget and matching custom arrows beside the items,
// and bigger dots above them
const inset = '0 20px';

export const Styling: Story = example({
  source: {
    host,
    presentationGuids,
  },
  widgetOptions: {
    item: {
      info: {
        bottom: [
          {
            field: 'publisher',
            label: false,
          },
          { field: 'title' },
        ],
      },
      showDurationOverlay: false,
    },
    nextIconUrl: nextIcon,
    playIconUrl: playIcon,
    previousIconUrl: previousIcon,
    style: {
      arrows: {
        // the size of the custom arrow images
        height: '48px',
        horizontalGap: '16px',
        width: '48px',
      },
      dots: {
        color: 'rgb(67 56 202 / .2)',
        horizontalGap: '10px',
        hoverColor: 'rgb(67 56 202 / .5)',
        placement: 'top',
        selectedColor: '#4338ca',
        size: '10px',
        verticalGap: '20px',
      },
      gap: '24px',
      item: {
        backgroundColor: '#fff',
        border: '1px solid rgb(15 23 42 / .06)',
        borderRadius: '12px',
        // the pages are cut on the sides, 4px beyond the items: the shadow drops below the tiles, not beside them
        boxShadow: '0 18px 28px -24px rgb(15 23 42 / .45)',
        fieldGap: '8px',
        hoverBorder: '1px solid rgb(67 56 202 / .3)',
        metadata: {
          publisher: {
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '.12em',
            padding: inset,
            textTransform: 'uppercase',
          },
          title: {
            color: '#111827',
            fontSize: '18px',
            fontWeight: '600',
            hoverColor: '#4338ca',
            lineClamp: 2,
            padding: inset,
          },
        },
        // the thumbnail touches the edges of the tile, the fields are inset
        padding: '0 0 20px',
        // the size of the custom play icon
        playButton: {
          height: '56px',
          width: '56px',
        },
        thumbnail: {
          // the top corners follow the tile, inside its 1px border
          borderRadius: '11px 11px 0 0',
        },
        thumbnailGap: '16px',
      },
      minItemWidth: '260px',
      transitionDuration: '500ms',
    },
  },
}, {
  // room for the shadow of the tiles, below them
  paddingBottom: '32px',
});

// a dark single item: square arrows beside it and bar-shaped dots, in the inline mode
export const StylingInline: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(4, 8),
  },
  widgetOptions: {
    item: {
      info: {
        bottom: [
          { field: 'title' },
          { field: 'summary' },
        ],
      },
    },
    playbackMode: 'inline',
    style: {
      ...singleItemStyle,
      arrows: {
        backgroundColor: '#d42a20',
        borderRadius: '0',
        color: '#fff',
        height: '36px',
        hoverBackgroundColor: '#a91f17',
        hoverColor: '#fff',
        padding: '8px',
        width: '36px',
      },
      dots: {
        color: '#d6d3d1',
        horizontalGap: '6px',
        hoverColor: '#a8a29e',
        selectedColor: '#d42a20',
        size: '6px',
      },
      item: {
        metadata: {
          summary: {
            color: '#57534e',
            lineClamp: 2,
          },
          title: {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '22px',
            fontWeight: '700',
          },
        },
        playButton: {
          backgroundColor: '#d42a20',
          borderRadius: '0',
          hoverBackgroundColor: '#a91f17',
        },
        thumbnail: {
          borderRadius: '0',
        },
      },
    },
  },
});

// the custom arrows over the edges of the items
export const OverlayArrows: Story = example({
  source: {
    host,
    presentationGuids,
  },
  widgetOptions: {
    nextIconUrl: nextIcon,
    playIconUrl: playIcon,
    previousIconUrl: previousIcon,
    style: {
      arrows: {
        height: '48px',
        position: 'overlay',
        width: '48px',
      },
      item: {
        // the size of the custom play icon
        playButton: {
          height: '56px',
          width: '56px',
        },
      },
    },
  },
});

export const ItemClick: Story = {
  parameters: {
    docs: {
      source: {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Carousel Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/carousel-widget.css">
  </head>
  <body>
    <div id="widget"></div>
    <ul id="logs"></ul>

    <script type="module">
      import { CarouselWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/carousel-widget.js';

      CarouselWidget.create({
        selector: '#widget',
        source: {
          host: '${host}',
          presentationGuids: ${JSON.stringify(presentationGuids.slice(0, 8))},
        },
        widgetOptions: {
          // replaces the modal, e.g. to open the presentation in your own page
          onItemClick(presentation) {
            const item = document.createElement('li');
            item.textContent = \`\${presentation.title} (\${presentation.guid})\`;
            document.querySelector('#logs')?.append(item);
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
    const widget = document.createElement('div');
    const logs = document.createElement('ul');

    logs.style.margin = '16px 0 0';
    container.append(widget, logs);

    renderCarousel({
      source: {
        host,
        presentationGuids: presentationGuids.slice(0, 8),
      },
      widgetOptions: {
        onItemClick(presentation: Presentation) {
          logs.innerHTML += `<li>${presentation.title} (${presentation.guid})</li>`;
        },
      },
    }, widget);

    return container;
  },
};

export const Playground: Story = {
  // the order of the args is the order of the controls, the data source first
  /* eslint-disable sort-keys */
  args: {
    source: 'smartSearchGuid',
    host,
    smartSearchGuid: docsPlaylistGuid,
    presentationGuids: presentationGuids.join(', '),
    searchMatch: 'all',
    searchField: docsMetadataGuid,
    searchComparator: 'is',
    searchValue: 'true',
    playbackMode: 'modal',
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
  render: (args: Partial<Args>) => renderCarousel(getPlaygroundConfigurationFromArgs(args)),
};
