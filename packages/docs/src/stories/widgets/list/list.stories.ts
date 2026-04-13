import type { StoryObj } from '@storybook/web-components-vite';
import { ListWidget } from 'lib';
import de from 'lib/locales/de.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/list-widget.css';
import { version } from '../../../../../../package.json';

type Story = StoryObj;

export default {
  component: 'presentation-widget',
};

export const Featured: Story = {
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

    ListWidget.create({
      guid: '22F7E642-EC19-F60C-6B61-E22ED2124B32',
      host: 'pbaron.qumu.dev',
      layout: 'featured',
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

export const Grid: Story = {
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

    ListWidget.create({
      guid: '22F7E642-EC19-F60C-6B61-E22ED2124B32',
      host: 'pbaron.qumu.dev',
      layout: 'grid',
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

export const Vertical: Story = {
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

    ListWidget.create({
      guid: '22F7E642-EC19-F60C-6B61-E22ED2124B32',
      host: 'pbaron.qumu.dev',
      layout: 'vertical',
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
