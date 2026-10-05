import type { StoryObj } from '@storybook/web-components-vite';
import type { StoryContext } from 'storybook/internal/types';
import { ListWidget, type ListWidgetConfiguration, type Presentation } from 'lib';
import de from 'lib/locales/de.json';
import en from 'lib/locales/en.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/list-widget.css';
import { type Args, argTypes, getHtmlSource, getPlaygroundConfigurationFromArgs } from './utils.ts';
import { version } from '../../../../../../package.json';

type Story = StoryObj;
type Configuration = Omit<ListWidgetConfiguration, 'selector'>;

export default {
  component: 'list-widget',
};

const host = 'demo.qumucloud.com';

const presentationGuids = [
  'JN6JHrg17xpwF8klXSIfFj',
  'TlvJB8ujYp54PmMBpKV0TZ',
  '248kK0jZZ2yBgQPc7yxms8',
  'g9ANFoOE45gkyjMqYP0mvZ',
  'v12JwVGie3S',
  'W0IiLMkOpXnMBePv9m13ZI',
  'VqYTNqsbLxTbcsOwYcIO28',
  'QLMMr6jc7n6QmnKWY0r2AS',
];

/**
 * Renders the widget in a new container, with all the locales so the toolbar's locale switcher works
 */
function renderList(configuration: Configuration, container = document.createElement('div')): HTMLElement {
  // the widget inherits the font of the page, which Storybook does not set
  container.style.fontFamily = 'system-ui, sans-serif';

  ListWidget.create({
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
function example(configuration: Configuration): Story {
  return {
    parameters: {
      docs: {
        source: {
          code: getHtmlSource(configuration),
        },
      },
    },
    render: () => renderList(configuration),
  };
}

export const Basic: Story = example({
  source: {
    host,
    // 9 presentations, 3 rows of 3 at the maximum width of the docs
    presentationGuids: [...presentationGuids, 'YFQW7Vfzpdx'],
  },
});

export const Vertical: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 4),
  },
  widgetOptions: {
    layout: 'vertical',
  },
});

export const SmartSearch: Story = example({
  source: {
    host,
    smartSearch: {
      match: 'all',
      rules: [
        {
          comparator: 'contains',
          field: 'title',
          value: 'driverless',
        },
      ],
    },
    sortBy: 'title',
    sortOrder: 'ASCENDING',
  },
});

export const InfoFields: Story = example({
  source: {
    host,
    presentationGuids: presentationGuids.slice(0, 4),
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
      minItemWidth: '120px',
    },
  },
});

// white tiles with a soft shadow and the thumbnail at the top, a small eyebrow above a big title and a short summary
const description = '4521001'; // the GUID of the "Description" metadata field of the demo tenant
const inset = '0 24px';

// a custom play icon, inlined as a data URL: a gradient circle with a soft ring and a rounded triangle.
// Only `#` needs escaping in an SVG data URL, the rest stays readable in the code example
const playIconSvg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#6366f1'/>
        <stop offset='1' stop-color='#a855f7'/>
      </linearGradient>
    </defs>
    <circle cx='32' cy='32' r='29' fill='url(#g)' stroke='#fff' stroke-opacity='.55' stroke-width='4'/>
    <path d='M27 22.4v19.2a2 2 0 0 0 3 1.7l15.4-9.6a2 2 0 0 0 0-3.4L30 20.7a2 2 0 0 0-3 1.7z' fill='#fff' transform='translate(-3 0)'/>
  </svg>
`;
const toDataUrl = (svg: string) => `data:image/svg+xml;utf8,${svg.replaceAll(/\n\s*/g, '').replaceAll('#', '%23')}`;
const playIcon = toDataUrl(playIconSvg);

export const Styling: Story = example({
  source: {
    host,
    presentationGuids: [
      'v12JwVGie3S',
      'YFQW7Vfzpdx',
      'irLRZpv3ByP',
      '0M1JtQNBZmt',
    ],
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
          {
            field: description,
            label: false,
          },
        ],
      },
      showDurationOverlay: false,
    },
    playIconUrl: playIcon,
    style: {
      gap: '24px',
      item: {
        backgroundColor: '#fff',
        border: '1px solid rgb(15 23 42 / .06)',
        borderRadius: '12px',
        boxShadow: '0 16px 40px -12px rgb(15 23 42 / .22)',
        fieldGap: '10px',
        hoverBackgroundColor: '#fbfaff',
        hoverBorder: '1px solid rgb(67 56 202 / .3)',
        metadata: {
          [description]: {
            color: '#6b7280',
            fontSize: '14px',
            lineClamp: 3,
            padding: inset,
          },
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
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            fontSize: '22px',
            fontWeight: '600',
            hoverColor: '#4338ca',
            letterSpacing: '-.015em',
            lineClamp: 2,
            padding: inset,
          },
        },
        // the thumbnail touches the edges of the tile, the fields are inset
        padding: '0 0 24px',
        // the size of the custom play icon
        playButton: {
          height: '56px',
          width: '56px',
        },
        thumbnail: {
          // the top corners follow the tile, inside its 1px border
          borderRadius: '11px 11px 0 0',
        },
        thumbnailGap: '20px',
      },
      // 2 columns at the maximum width of the docs
      minItemWidth: '320px',
    },
  },
});

// a newspaper look for the vertical layout: a red accent, serif headlines and standfirsts,
// plain rows divided by a vivid bottom line, and a square play icon
const newspaperSerif = 'Georgia, "Times New Roman", serif';
const newspaperSans = '"Helvetica Neue", Arial, sans-serif';
const squarePlayIcon = toDataUrl(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <rect x='4' y='4' width='56' height='56' fill='#d42a20'/>
    <path d='M27 22.4v19.2a2 2 0 0 0 3 1.7l15.4-9.6a2 2 0 0 0 0-3.4L30 20.7a2 2 0 0 0-3 1.7z' fill='#fff' transform='translate(-3 0)'/>
  </svg>
`);

export const StylingVertical: Story = example({
  source: {
    host,
    presentationGuids: [
      'v12JwVGie3S',
      'YFQW7Vfzpdx',
      'irLRZpv3ByP',
    ],
  },
  widgetOptions: {
    item: {
      info: {
        right: [
          {
            field: 'publisher',
            label: false,
          },
          { field: 'title' },
          {
            field: description,
            label: false,
          },
          {
            field: 'publishOn',
            label: false,
          },
        ],
      },
    },
    layout: 'vertical',
    playIconUrl: squarePlayIcon,
    style: {
      gap: '0',
      item: {
        // a bottom border: `border` sets the 4 sides, an inset shadow draws only the bottom one
        boxShadow: 'inset 0 -2px 0 #d42a20',
        durationBadge: {
          backgroundColor: '#1b1b1b',
          borderRadius: '0',
          fontFamily: newspaperSans,
          fontWeight: '600',
          padding: '2px 6px',
          position: 'bottom-left',
        },
        fieldGap: '8px',
        hoverBackgroundColor: '#faf7f0',
        metadata: {
          // the standfirst
          [description]: {
            color: '#3f3f3f',
            fontFamily: newspaperSerif,
            fontSize: '15px',
            lineClamp: 2,
          },
          // the fly title
          publisher: {
            color: '#d42a20',
            fontFamily: newspaperSans,
            fontSize: '13px',
            fontWeight: '700',
          },
          publishOn: {
            color: '#6e6e6e',
            fontFamily: newspaperSans,
            fontSize: '12px',
          },
          title: {
            color: '#1b1b1b',
            fontFamily: newspaperSerif,
            fontSize: '22px',
            fontWeight: '700',
            hoverColor: '#d42a20',
            lineClamp: 2,
          },
        },
        padding: '20px 0',
        // the size of the custom play icon
        playButton: {
          height: '44px',
          position: 'bottom-right',
          width: '44px',
        },
        thumbnail: {
          borderRadius: '0',
          width: '280px',
        },
        thumbnailGap: '24px',
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
    <title>List Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/list-widget.css">
  </head>
  <body>
    <div id="widget"></div>
    <ul id="logs"></ul>

    <script type="module">
      import { ListWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/list-widget.js';

      ListWidget.create({
        selector: '#widget',
        source: {
          host: '${host}',
          presentationGuids: ${JSON.stringify(presentationGuids.slice(0, 4))},
        },
        widgetOptions: {
          // replaces the modal, e.g. to open the presentation in your own page
          onItemClick(presentation) {
            document.querySelector('#logs').innerHTML += \`<li>\${presentation.title} (\${presentation.guid})</li>\`;
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

    renderList({
      source: {
        host,
        presentationGuids: presentationGuids.slice(0, 4),
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
    source: 'presentationGuids',
    host,
    presentationGuids: presentationGuids.join(', '),
    searchMatch: 'all',
    searchField: 'title',
    searchComparator: 'contains',
    searchValue: 'driverless',
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
  render: (args: Partial<Args>) => renderList(getPlaygroundConfigurationFromArgs(args)),
};
