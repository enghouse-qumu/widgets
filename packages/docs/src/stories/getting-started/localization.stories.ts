import type { StoryObj } from '@storybook/web-components-vite';
import { PresentationWidget } from 'lib';
import de from 'lib/locales/de.json';
import es from 'lib/locales/es.json';
import fr from 'lib/locales/fr.json';
import it from 'lib/locales/it.json';
import ja from 'lib/locales/ja.json';
import pt from 'lib/locales/pt.json';
import 'lib/presentation-widget.css';
import { version } from '../../../../../package.json';

type Story = StoryObj;

export default {
  component: 'localization',
};

export const Localization: Story = {
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
    <p>The widget below uses the lang attribute from the html tag</p>
    <div id="widget1"></div>
    
    <p>The widget below is forced to French thanks to lang="fr"</p>
    <div id="widget2" lang="fr"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/presentation-widget.js';

      const fr = await fetch('https://unpkg.com/@qumu/widgets@1.0.0/dist/locales/fr.json').then((res) => res.json());      
      
      PresentationWidget.create({
        host:'demo.qumucloud.com',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        selector: '#widget1',
      }).catch((err) => console.log(err));
      
      PresentationWidget.create({
        host: 'demo.qumucloud.com',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        locales: {
          fr,
        },
        selector: '#widget2',
      }).catch((err) => console.log(err));
    </script>
  </body>
</html>`,
      },
    },
  },
  render: () => {
    const container = document.createElement('div');

    const p1 = document.createElement('p');

    p1.innerHTML = 'The widget below uses the lang attribute from the html tag';

    const p2 = document.createElement('p');

    p2.innerHTML = 'The widget below is forced to French thanks to lang="fr"';

    const widget1 = document.createElement('div');

    const widget2 = document.createElement('div');

    widget2.setAttribute('lang', 'fr');

    container.appendChild(p1);
    container.appendChild(widget1);
    container.appendChild(p2);
    container.appendChild(widget2);

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
      selector: widget1,
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
      selector: widget2,
    }).catch(console.error);

    return container;
  },
};
