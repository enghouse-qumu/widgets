import type { ItemTemplateConfig, ListWidgetConfiguration, ListWidgetStyle, SearchRule } from 'lib';
import { version } from '../../../../../../package.json';

type Metadata = NonNullable<NonNullable<ListWidgetStyle['item']>['metadata']>;

export interface Args {
  [arg: string]: unknown;
  host: string;
  info?: ItemTemplateConfig['info'];
  presentationGuids?: string;
  searchComparator?: SearchRule['comparator'];
  searchField?: string;
  searchMatch?: 'any' | 'all';
  searchValue?: string;
  smartSearchGuid?: string;
  source: 'presentationGuids' | 'smartSearch' | 'smartSearchGuid';
  styleItemMetadata?: Metadata;
}

interface Control {
  arg: string;
  category: 'Configuration' | 'Style';
  control: 'boolean' | 'color' | 'number' | 'object' | 'select' | 'text';
  // the documented default value
  defaultValue?: string;
  // shown only when the condition is met, see https://storybook.js.org/docs/api/arg-types#if
  if?: {
    arg: string;
    eq?: unknown;
    neq?: unknown;
  };
  name: string;
  options?: string[];
  // where the value goes in the configuration; the source and the info are handled separately
  path?: string;
  subcategory?: string;
}

const positions = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'];

const comparators: Array<SearchRule['comparator']> = [
  'is',
  'is_not',
  'contains',
  'does_not_contain',
  'contains_any',
  'less_than',
  'greater_than',
  'greater_than_or_equal_to',
  'less_than_or_equal_to',
  'between',
  'not_between',
  'in_the_last',
  'not_in_the_last',
  'in_the_next',
  'not_in_the_next',
];

const style = (subcategory: string, arg: string, name: string, path: string, control: Control['control'] = 'text', defaultValue?: string, options?: string[]): Control => ({
  arg,
  category: 'Style',
  control,
  defaultValue,
  name,
  options,
  path: `widgetOptions.style.${path}`,
  subcategory,
});

const player = (arg: string, name: string, path: string, control: Control['control'] = 'text', options?: string[]): Control => ({
  arg,
  category: 'Configuration',
  control,
  name,
  options,
  path: `playerParameters.${path}`,
  subcategory: 'Player Parameters',
});

/**
 * The controls of the playground: the arguments, their documentation and where they go in the configuration
 */
export const controls: Control[] = [
  // Source
  {
    arg: 'source',
    category: 'Configuration',
    control: 'select',
    name: 'Data Source',
    options: ['presentationGuids', 'smartSearch', 'smartSearchGuid'],
    subcategory: 'Source',
  },
  {
    arg: 'host',
    category: 'Configuration',
    control: 'text',
    name: 'Host',
    subcategory: 'Source',
  },
  {
    arg: 'presentationGuids',
    category: 'Configuration',
    control: 'text',
    if: {
      arg: 'source',
      eq: 'presentationGuids',
    },
    name: 'Presentation GUIDs (comma separated)',
    subcategory: 'Source',
  },
  {
    arg: 'smartSearchGuid',
    category: 'Configuration',
    control: 'text',
    if: {
      arg: 'source',
      eq: 'smartSearchGuid',
    },
    name: 'Smart Search GUID',
    subcategory: 'Source',
  },
  {
    arg: 'searchMatch',
    category: 'Configuration',
    control: 'select',
    if: {
      arg: 'source',
      eq: 'smartSearch',
    },
    name: 'Smart Search: Match',
    options: ['all', 'any'],
    subcategory: 'Source',
  },
  {
    arg: 'searchField',
    category: 'Configuration',
    control: 'text',
    if: {
      arg: 'source',
      eq: 'smartSearch',
    },
    name: 'Smart Search: Rule Field',
    subcategory: 'Source',
  },
  {
    arg: 'searchComparator',
    category: 'Configuration',
    control: 'select',
    if: {
      arg: 'source',
      eq: 'smartSearch',
    },
    name: 'Smart Search: Rule Comparator',
    options: comparators,
    subcategory: 'Source',
  },
  {
    arg: 'searchValue',
    category: 'Configuration',
    control: 'text',
    if: {
      arg: 'source',
      eq: 'smartSearch',
    },
    name: 'Smart Search: Rule Value',
    subcategory: 'Source',
  },
  {
    arg: 'limit',
    category: 'Configuration',
    control: 'number',
    defaultValue: '12 (grid), 10 (vertical), the number of GUIDs',
    name: 'Limit',
    path: 'source.limit',
    subcategory: 'Source',
  },
  {
    arg: 'offset',
    category: 'Configuration',
    control: 'number',
    defaultValue: '0',
    name: 'Offset',
    path: 'source.offset',
    subcategory: 'Source',
  },
  {
    arg: 'sortBy',
    category: 'Configuration',
    control: 'text',
    defaultValue: 'created',
    if: {
      arg: 'source',
      neq: 'presentationGuids',
    },
    name: 'Sort By',
    path: 'source.sortBy',
    subcategory: 'Source',
  },
  {
    arg: 'sortOrder',
    category: 'Configuration',
    control: 'select',
    defaultValue: 'DESCENDING',
    if: {
      arg: 'source',
      neq: 'presentationGuids',
    },
    name: 'Sort Order',
    options: ['ASCENDING', 'DESCENDING'],
    path: 'source.sortOrder',
    subcategory: 'Source',
  },

  // Widget options
  {
    arg: 'layout',
    category: 'Configuration',
    control: 'select',
    defaultValue: 'grid',
    name: 'Layout',
    options: ['grid', 'vertical'],
    path: 'widgetOptions.layout',
    subcategory: 'Widget Options',
  },
  {
    arg: 'showDurationOverlay',
    category: 'Configuration',
    control: 'boolean',
    defaultValue: 'true',
    name: 'Show the Duration Badge',
    path: 'widgetOptions.item.showDurationOverlay',
    subcategory: 'Widget Options',
  },
  {
    arg: 'info',
    category: 'Configuration',
    control: 'object',
    defaultValue: 'depends on the layout',
    name: 'Info Fields (item.info)',
    subcategory: 'Widget Options',
  },
  {
    arg: 'playIconUrl',
    category: 'Configuration',
    control: 'text',
    name: 'Custom Play Icon URL',
    path: 'widgetOptions.playIconUrl',
    subcategory: 'Widget Options',
  },

  // Player parameters
  player('playerAudio', 'Audio Language', 'audio'),
  player('playerCaptions', 'Captions Language', 'captions'),
  player('playerConfigurationGuid', 'Player Configuration Guid', 'playerConfigurationGuid'),
  player('playerDebug', 'Enable Debug Mode', 'debug', 'boolean'),
  player('playerLoop', 'Loop', 'loop', 'boolean'),
  player('playerQuality', 'Quality', 'quality', 'select', ['auto', 'best', '1440p', '1080p', '720p', '480p', '240p']),
  player('playerReporting', 'Enable Playback Analytics', 'reporting', 'boolean'),
  player('playerReportingId', 'Reporting ID', 'reportingId'),
  player('playerShowControlPanel', 'Show the Control Panel', 'showControlPanel', 'boolean'),
  player('playerSidebar', 'Show the Sidebar', 'sidebar', 'boolean'),
  player('playerStart', 'Start at', 'start'),
  player('playerView', 'View', 'pv', 'select', ['pipls', 'pipss', 'sbs']),
  player('playerVolume', 'Volume', 'volume', 'number'),

  // Widget style
  style('Widget', 'styleWidth', 'Width', 'width', 'text', '100%'),
  style('Widget', 'styleHeight', 'Height', 'height', 'text', 'auto'),
  style('Widget', 'styleBorderRadius', 'Border Radius', 'borderRadius', 'text', '0'),
  style('Widget', 'styleGap', 'Gap', 'gap', 'text', '16px'),
  style('Widget', 'styleColumns', 'Columns (grid, "auto" or a number)', 'columns', 'text', 'auto'),
  style('Widget', 'styleMinItemWidth', 'Min Item Width (grid)', 'minItemWidth', 'text', '240px'),

  // Item style
  style('Item', 'styleItemBackgroundColor', 'Background Color', 'item.backgroundColor', 'color', 'transparent'),
  style('Item', 'styleItemHoverBackgroundColor', 'Background Color (hover state)', 'item.hoverBackgroundColor', 'color'),
  style('Item', 'styleItemBorder', 'Border', 'item.border', 'text', 'none'),
  style('Item', 'styleItemHoverBorder', 'Border (hover state)', 'item.hoverBorder'),
  style('Item', 'styleItemActiveBorder', 'Border (active state)', 'item.activeBorder'),
  style('Item', 'styleItemBorderRadius', 'Border Radius', 'item.borderRadius', 'text', '0'),
  style('Item', 'styleItemBoxShadow', 'Box Shadow', 'item.boxShadow', 'text', 'none'),
  style('Item', 'styleItemPadding', 'Padding', 'item.padding', 'text', '0'),
  style('Item', 'styleItemFieldGap', 'Field Gap', 'item.fieldGap', 'text', '4px'),
  style('Item', 'styleItemThumbnailGap', 'Thumbnail Gap', 'item.thumbnailGap', 'text', '8px / 12px'),

  // Thumbnail style
  style('Thumbnail', 'styleThumbnailAspectRatio', 'Aspect Ratio', 'item.thumbnail.aspectRatio', 'text', '16:9'),
  style('Thumbnail', 'styleThumbnailBorder', 'Border', 'item.thumbnail.border', 'text', 'none'),
  style('Thumbnail', 'styleThumbnailBorderRadius', 'Border Radius', 'item.thumbnail.borderRadius', 'text', '6px'),
  style('Thumbnail', 'styleThumbnailImageFit', 'Image Fit', 'item.thumbnail.imageFit', 'select', 'cover', ['contain', 'cover']),
  style('Thumbnail', 'styleThumbnailWidth', 'Width (vertical layout)', 'item.thumbnail.width', 'text', '240px'),

  // Play button style
  style('Play Button', 'stylePlayButtonBackgroundColor', 'Background Color (default state)', 'item.playButton.backgroundColor', 'color', 'rgb(0 0 0 / .8)'),
  style('Play Button', 'stylePlayButtonColor', 'Color (default state)', 'item.playButton.color', 'color', '#fff'),
  style('Play Button', 'stylePlayButtonHoverBackgroundColor', 'Background Color (hover state)', 'item.playButton.hoverBackgroundColor', 'color', '#000'),
  style('Play Button', 'stylePlayButtonHoverColor', 'Color (hover state)', 'item.playButton.hoverColor', 'color', '#fff'),
  style('Play Button', 'stylePlayButtonActiveBackgroundColor', 'Background Color (active state)', 'item.playButton.activeBackgroundColor', 'color', 'rgb(0 0 0 / .9)'),
  style('Play Button', 'stylePlayButtonActiveColor', 'Color (active state)', 'item.playButton.activeColor', 'color', '#fff'),
  style('Play Button', 'stylePlayButtonBorderRadius', 'Border Radius', 'item.playButton.borderRadius', 'text', '100%'),
  style('Play Button', 'stylePlayButtonMargin', 'Margin', 'item.playButton.margin', 'text', '8px'),
  style('Play Button', 'stylePlayButtonPadding', 'Padding', 'item.playButton.padding', 'text', '8px'),
  style('Play Button', 'stylePlayButtonPosition', 'Position', 'item.playButton.position', 'select', 'center', positions),
  style('Play Button', 'stylePlayButtonHeight', 'Height', 'item.playButton.height', 'text', '40px'),
  style('Play Button', 'stylePlayButtonWidth', 'Width', 'item.playButton.width', 'text', '40px'),

  // Duration badge style
  style('Duration Badge', 'styleDurationBadgeBackgroundColor', 'Background Color', 'item.durationBadge.backgroundColor', 'color', 'rgb(0 0 0 / .8)'),
  style('Duration Badge', 'styleDurationBadgeColor', 'Color', 'item.durationBadge.color', 'color', '#fff'),
  style('Duration Badge', 'styleDurationBadgeBorderRadius', 'Border Radius', 'item.durationBadge.borderRadius', 'text', '4px'),
  style('Duration Badge', 'styleDurationBadgeFontFamily', 'Font Family', 'item.durationBadge.fontFamily', 'text', 'inherit'),
  style('Duration Badge', 'styleDurationBadgeFontSize', 'Font Size', 'item.durationBadge.fontSize', 'text', '12px'),
  style('Duration Badge', 'styleDurationBadgeFontWeight', 'Font Weight', 'item.durationBadge.fontWeight', 'text', '400'),
  style('Duration Badge', 'styleDurationBadgeLetterSpacing', 'Letter Spacing', 'item.durationBadge.letterSpacing', 'text', 'inherit'),
  style('Duration Badge', 'styleDurationBadgePadding', 'Padding', 'item.durationBadge.padding', 'text', '2px 6px'),
  style('Duration Badge', 'styleDurationBadgePosition', 'Position', 'item.durationBadge.position', 'select', 'bottom-right', positions),
  style('Duration Badge', 'styleDurationBadgeTextTransform', 'Text Transform', 'item.durationBadge.textTransform', 'text', 'inherit'),

  // Info fields style
  {
    arg: 'styleItemMetadata',
    category: 'Style',
    control: 'object',
    name: 'Per Field Style (item.metadata)',
    subcategory: 'Info Fields',
  },

  // Dialog, close button and not found styles, shared with the presentation widget
  style('Dialog', 'styleDialogBackdropColor', 'Backdrop Color', 'dialog.backdropColor', 'color', 'rgb(0 0 0 / .5)'),
  style('Dialog', 'styleDialogBackgroundColor', 'Background Color', 'dialog.backgroundColor', 'color', '#000'),
  style('Dialog', 'styleDialogBorder', 'Border', 'dialog.border', 'text', '3px solid #000'),
  style('Dialog', 'styleDialogBorderRadius', 'Border Radius', 'dialog.borderRadius', 'text', '0'),
  style('Dialog', 'styleDialogMaxWidth', 'Max Width', 'dialog.maxWidth', 'text', '1100px'),
  style('Dialog', 'styleDialogPadding', 'Padding', 'dialog.padding', 'text', '0'),
  style('Dialog', 'styleDialogWidth', 'Width', 'dialog.width', 'text', '90vw'),
  style('Close Button', 'styleCloseButtonBackgroundColor', 'Background Color (default state)', 'closeButton.backgroundColor', 'color', 'rgb(0 0 0 / .75)'),
  style('Close Button', 'styleCloseButtonColor', 'Color (default state)', 'closeButton.color', 'color', '#fff'),
  style('Close Button', 'styleCloseButtonHoverBackgroundColor', 'Background Color (hover state)', 'closeButton.hoverBackgroundColor', 'color', 'rgb(0 0 0 / .9)'),
  style('Close Button', 'styleCloseButtonHoverColor', 'Color (hover state)', 'closeButton.hoverColor', 'color', '#fff'),
  style('Close Button', 'styleCloseButtonActiveBackgroundColor', 'Background Color (active state)', 'closeButton.activeBackgroundColor', 'color', '#000'),
  style('Close Button', 'styleCloseButtonActiveColor', 'Color (active state)', 'closeButton.activeColor', 'color', '#fff'),
  style('Close Button', 'styleCloseButtonBorderRadius', 'Border Radius', 'closeButton.borderRadius', 'text', '100%'),
  style('Close Button', 'styleCloseButtonBoxShadow', 'Box Shadow', 'closeButton.boxShadow', 'text', '0 0 1px 1px #000'),
  style('Close Button', 'styleCloseButtonIconSize', 'Icon Size', 'closeButton.iconSize', 'text', '20px'),
  style('Close Button', 'styleCloseButtonPadding', 'Padding', 'closeButton.padding', 'text', '6px'),
  style('Not Found', 'styleNotFoundBackgroundColor', 'Background Color', 'notFound.backgroundColor', 'color', 'transparent'),
  style('Not Found', 'styleNotFoundBorder', 'Border', 'notFound.border'),
  style('Not Found', 'styleNotFoundColor', 'Color', 'notFound.color', 'color'),
  style('Not Found', 'styleNotFoundIconColor', 'Icon Color', 'notFound.iconColor', 'color'),
];

/**
 * The Storybook `argTypes` of the playground, generated from the controls
 */
export const argTypes = Object.fromEntries(controls.map((control) => [
  control.arg,
  {
    control: control.control,
    if: control.if,
    name: control.name,
    options: control.options,
    table: {
      category: control.category,
      defaultValue: control.defaultValue === undefined ? undefined : { summary: control.defaultValue },
      subcategory: control.subcategory,
    },
  },
]));

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;

  let node = target;

  keys.forEach((key) => {
    node[key] ??= {};
    node = node[key] as Record<string, unknown>;
  });

  node[last] = value;
}

const isSet = (value: unknown) => value !== undefined && value !== null && value !== '';

/**
 * Get the configuration of the widget from the arguments of the playground
 *
 * @param args the arguments from the story context
 */
export function getPlaygroundConfigurationFromArgs(args: Partial<Args>): Omit<ListWidgetConfiguration, 'selector'> {
  const configuration: Record<string, unknown> = {};

  setPath(configuration, 'source.host', args.host);

  // exactly one data source
  if (args.source === 'presentationGuids') {
    setPath(configuration, 'source.presentationGuids', (args.presentationGuids ?? '').split(',').map((guid) => guid.trim())
      .filter(Boolean));
  } else if (args.source === 'smartSearchGuid') {
    setPath(configuration, 'source.smartSearchGuid', args.smartSearchGuid);
  } else {
    setPath(configuration, 'source.smartSearch', {
      match: args.searchMatch ?? 'all',
      rules: [
        {
          comparator: args.searchComparator ?? 'contains',
          field: args.searchField ?? 'title',
          value: args.searchValue ?? '',
        },
      ],
    });
  }

  controls.forEach(({ arg, path }) => {
    const value = args[arg];

    // presentation GUIDs are always listed in the given order
    if (!path || !isSet(value) || (args.source === 'presentationGuids' && path.startsWith('source.sort'))) {
      return;
    }

    // `columns` is either "auto" or a number
    setPath(configuration, path, arg === 'styleColumns' && value !== 'auto' ? Number(value) : value);
  });

  if (args.info && Object.keys(args.info).length) {
    setPath(configuration, 'widgetOptions.item.info', args.info);
  }

  if (args.styleItemMetadata && Object.keys(args.styleItemMetadata).length) {
    setPath(configuration, 'widgetOptions.style.item.metadata', args.styleItemMetadata);
  }

  return configuration as unknown as Omit<ListWidgetConfiguration, 'selector'>;
}

/**
 * The HTML source of an example, as an embedder would write it
 *
 * @param configuration the configuration of the widget, without the selector
 */
export function getHtmlSource(configuration: object): string {
  const json = JSON.stringify({
    selector: '#widget',
    ...configuration,
  }, null, 2)
    .split('\n')
    // the indentation inside <script>
    .map((line, index) => (index === 0 ? line : `      ${line}`))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>List Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/list-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { ListWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/list-widget.js';

      ListWidget.create(${json}).catch((err) => console.log(err));
    </script>
  </body>
</html>`;
}
