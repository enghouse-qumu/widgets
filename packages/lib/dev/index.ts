/**
 * Dev playground: edit the configurations below and save, the widgets are re-created automatically.
 * Changes in `src/` are picked up the same way. Run it with `npm run server`.
 */
import { ListWidget, PresentationWidget } from '../src/index';
import type { ListWidgetConfiguration, WidgetConfiguration } from '../src/index';

// don't send telemetry from the playground
// eslint-disable-next-line no-underscore-dangle
window.__QUMU_WIDGET_TELEMETRY__ = false;

// const host = 'demo.qumucloud.com';
const host = 'mwitalinski1.qumu.dev';

const listGrid: ListWidgetConfiguration = {
  selector: '#list-grid',
  source: {
    host,
    limit: 16,
    smartSearch: {
      match: 'all',
      rules: [
        {
          comparator: 'contains',
          field: 'title',
          value: '',
        },
      ],
    },
    sortBy: 'published',
    sortOrder: 'DESCENDING',
  },
  widgetOptions: {
    item: {
      info: {
        bottom: [
          { field: 'title' },
          { field: '6' },
          {
            field: 'publishOn',
            label: true,
          },
          {
            field: 'duration',
            label: 'Długość',
          },
          {
            field: 'publisher',
            label: true,
          },
        ],
      },
    //   showDurationOverlay: false,
    },
    layout: 'grid',
    // cyberpunk theme, see also the `#list-grid` styles in index.html
    style: {
      closeButton: {
        activeBackgroundColor: '#c41f53',
        backgroundColor: '#fcee0a',
        borderRadius: '0',
        color: '#0d0221',
        hoverBackgroundColor: '#ff2a6d',
        hoverColor: '#fff',
      },
      columns: 5,
      dialog: {
        backdropColor: 'rgb(13 2 33 / .85)',
        border: '2px solid #ff2a6d',
      },
      gap: '20px',
      item: {
        activeBorder: '1px solid #ff2a6d',
        backgroundColor: '#0d0221',
        border: '1px solid #00f0ff',
        borderRadius: '0',
        boxShadow: '0 0 10px rgb(0 240 255 / .45), inset 0 0 14px rgb(0 240 255 / .12)',
        durationBadge: {
          backgroundColor: '#fcee0a',
          borderRadius: '0',
          color: '#0d0221',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '.08em',
          padding: '2px 6px',
        },
        hoverBackgroundColor: '#1d0a3a',
        hoverBorder: '1px solid #fcee0a',
        metadata: {
          duration: {
            color: '#fcee0a',
            labelColor: '#ff2a6d',
          },
          '6': {
            color: '#ff9f1c',
            labelColor: '#ff2a6d',
          },
          publisher: {
            color: '#d1f7ff',
            labelColor: '#ff2a6d',
          },
          publishOn: {
            color: '#05ffa1',
            hoverLabelColor: '#fcee0a',
            labelColor: '#ff2a6d',
          },
          title: {
            color: '#00f0ff',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: '700',
            hoverColor: '#fcee0a',
            letterSpacing: '.04em',
            lineClamp: 2,
            textTransform: 'uppercase',
          },
        },
        padding: '10px',
        playButton: {
          activeBackgroundColor: '#c41f53',
          backgroundColor: '#fcee0a',
          borderRadius: '0',
          color: '#0d0221',
          hoverBackgroundColor: '#ff2a6d',
          hoverColor: '#fff',
        },
        thumbnail: {
          border: '2px solid #ff2a6d',
          borderRadius: '0',
        },
      },
      minItemWidth: '200px',
      notFound: {
        border: '2px solid #c41f53',
        color: '#fcee0a',
        iconColor: '#00f0ff',
      },
    },
    // uncomment to handle the click yourself instead of opening the player
    // onItemClick: (presentation) => console.log('clicked', presentation),
  },
};

// YouTube search results theme, see also the `.youtube` styles in index.html
const youtubeFont = 'Roboto, Arial, sans-serif';
const youtubeGrey = '#606060';

const listVertical: ListWidgetConfiguration = {
  selector: '#list-vertical',
  source: {
    host,
    smartSearchGuid: 'vXY8V8W4dVQoD9s9q2suUA',
    sortBy: 'published',
    sortOrder: 'DESCENDING',
  },
  widgetOptions: {
    item: {
      info: {
        right: [
          { field: 'title' },
          {
            field: 'publishOn',
            label: false,
          },
          {
            field: 'publisher',
            label: false,
          },
          { field: 'summary' },
          { field: '2' },
          { field: '3' },
          { field: '4' },
          { field: '5' },
          { field: '6' },
          { field: '7' },
          { field: '8' },
          { field: '9' },
          { field: '10' },
          { field: '11' },
          { field: '12' },
        ],
      },
      showDurationOverlay: true,
    },
    layout: 'vertical',
    style: {
      dialog: {
        backdropColor: 'rgb(13 2 33 / .85)',
        border: '2px solid #f00',
        borderRadius: '8px',
      },
      gap: '32px',
      item: {
        durationBadge: {
          backgroundColor: 'rgb(0 0 0 / .8)',
          borderRadius: '4px',
          color: '#fff',
          fontFamily: youtubeFont,
          fontSize: '12px',
          fontWeight: '500',
          letterSpacing: '.3px',
          padding: '1px 4px',
          position: 'bottom-left',
        },
        metadata: {
          6: {
            color: 'red',
            fontFamily: youtubeFont,
            fontSize: '12px',
            lineClamp: 2,
          },
          publisher: {
            color: youtubeGrey,
            fontFamily: youtubeFont,
            fontSize: '12px',
            hoverColor: '#0f0f0f',
            padding: '8px 0',
          },
          publishOn: {
            color: youtubeGrey,
            fontFamily: youtubeFont,
            fontSize: '12px',
          },
          summary: {
            color: youtubeGrey,
            fontFamily: youtubeFont,
            fontSize: '12px',
            lineClamp: 2,
          },
          title: {
            color: '#0f0f0f',
            fontFamily: youtubeFont,
            fontSize: '18px',
            fontWeight: '400',
            lineClamp: 2,
          },
        },
        // no play icon, only a red overlay on hover
        playButton: {
          activeBackgroundColor: 'rgb(213, 0, 0)',
          activeColor: '#fff',
          backgroundColor: 'transparent',
          borderRadius: '4px',
          color: 'transparent',
          height: '25px',
          hoverBackgroundColor: '#f00',
          hoverColor: '#fff',
          padding: '4px',
          position: 'bottom-right',
          width: '30px',
        },
        thumbnail: {
          aspectRatio: '16:9',
          borderRadius: '12px',
          width: '360px',
        },
      },
    },
  },
};

const presentation: WidgetConfiguration = {
  guid: 'fNqFhb50ypwvdn5EaM0snz',
  host,
  selector: '#presentation',
  widgetOptions: {
    playbackMode: 'modal',
    // playbackMode: 'inline-autoload',
    // playbackMode: 'inline-autoplay',
  },
};

const widgets = await Promise.allSettled([
  ListWidget.create(listGrid),
  ListWidget.create(listVertical),
  PresentationWidget.create(presentation),
]);

widgets.forEach((result) => {
  if (result.status === 'rejected') {
    console.error(result.reason);
  }
});

// re-create the widgets on change instead of reloading the whole page
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    widgets.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.destroy();
      }
    });
  });
}
