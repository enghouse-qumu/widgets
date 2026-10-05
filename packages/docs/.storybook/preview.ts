import type { Preview } from '@storybook/web-components-vite';
import './preview.css';
import { StoryContext } from 'storybook/internal/types';

// Adds a locale switcher in the toolbar
export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'de', title: '🇩🇪 Deutsch', right: 'de' },
        { value: 'en', title: '🇺🇸 English', right: 'en' },
        { value: 'es', title: '🇪🇸 Español', right: 'es' },
        { value: 'fr', title: '🇫🇷 Français', right: 'fr' },
        { value: 'it', title: '🇮🇹 Italiano', right: 'it' },
        { value: 'ja', title: '🇯🇵 日本語', right: 'ja' },
        { value: 'pt', title: '🇵🇹 Português', right: 'pt' },
      ],
      showName: true,
    },
  },
};

// 🧩 Inject locale into your components or global context
export const decorators = [
  (storyFn: () => any, { globals }: StoryContext) => {
    // Sets the whole document's locale
    document.documentElement.lang = globals.locale;
    // Sets the whole document's color scheme
    document.documentElement.style.colorScheme = globals.backgrounds.value === 'dark' ? 'dark' : 'light';

    // Disable telemetry for the widgets
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any).__QUMU_WIDGET_TELEMETRY__ = false;

    return storyFn();
  },
];

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        // 👇 Default options
        dark: { name: 'Dark', value: '#000' },
        light: { name: 'Light', value: '#fff' },
      },
    },
    docs: {
      toc: {
        headingSelector: 'h2, h3',
      },
      codePanel: true,
    },
    options: {
      storySort: {
        order: [
          'Getting Started',
          [
            'Installation',
            [
              'Via NPM',
              'Via CDN'
            ],
            'Localization'
          ],
          'Widgets',
          [
            'Presentation',
            'List'
          ]
        ],
      },
    }
  },
};

export default preview;
