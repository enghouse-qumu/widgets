import type { PlaylistItemTemplateConfig, PlaylistWidgetConfiguration, PlaylistWidgetStyle, SearchRule } from 'lib';
import { version } from '../../../../../../package.json';

type Metadata = NonNullable<NonNullable<PlaylistWidgetStyle['item']>['metadata']>;

export interface Args {
  [arg: string]: unknown;
  host: string;
  info?: PlaylistItemTemplateConfig['info'];
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

const button = (arg: string, name: string, path: string): Control => ({
  arg,
  category: 'Configuration',
  control: 'boolean',
  defaultValue: 'true',
  name,
  path: `widgetOptions.controls.${path}`,
  subcategory: 'Controls',
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
    defaultValue: '100, the number of GUIDs',
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
    arg: 'playbackMode',
    category: 'Configuration',
    control: 'select',
    defaultValue: 'inline',
    name: 'Playback Mode (first item)',
    options: ['inline', 'inline-autoload', 'inline-autoplay'],
    path: 'widgetOptions.playbackMode',
    subcategory: 'Widget Options',
  },
  {
    arg: 'showPlayer',
    category: 'Configuration',
    control: 'boolean',
    defaultValue: 'true',
    name: 'Show the Player',
    path: 'widgetOptions.showPlayer',
    subcategory: 'Widget Options',
  },
  {
    arg: 'loop',
    category: 'Configuration',
    control: 'boolean',
    defaultValue: 'false',
    name: 'Loop the Playlist',
    path: 'widgetOptions.loop',
    subcategory: 'Widget Options',
  },
  {
    arg: 'trackProgress',
    category: 'Configuration',
    control: 'boolean',
    defaultValue: 'true',
    name: 'Track the Progress',
    path: 'widgetOptions.trackProgress',
    subcategory: 'Widget Options',
  },
  {
    arg: 'info',
    category: 'Configuration',
    control: 'object',
    defaultValue: '{ left: [title], right: [duration] }',
    name: 'Row Fields (item.info)',
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

  // Optional buttons of the control bar
  button('controlsVolume', 'Volume', 'volume'),
  button('controlsAudioTracks', 'Audio Languages', 'audioTracks'),
  button('controlsCaptions', 'Captions', 'captions'),
  button('controlsPlaybackRate', 'Playback Speed', 'playbackRate'),
  button('controlsQuality', 'Quality', 'quality'),
  button('controlsAudienceReactions', 'Audience Reactions', 'audienceReactions'),
  button('controlsFullscreen', 'Fullscreen', 'fullscreen'),

  // Player parameters, without `showControlPanel`: the widget renders its own controls
  player('playerAudio', 'Audio Language', 'audio'),
  player('playerCaptions', 'Captions Language', 'captions'),
  player('playerConfigurationGuid', 'Player Configuration Guid', 'playerConfigurationGuid'),
  player('playerDebug', 'Enable Debug Mode', 'debug', 'boolean'),
  player('playerLoop', 'Loop the Item', 'loop', 'boolean'),
  player('playerQuality', 'Quality', 'quality', 'select', ['auto', 'best', '1440p', '1080p', '720p', '480p', '240p']),
  player('playerReporting', 'Enable Playback Analytics', 'reporting', 'boolean'),
  player('playerReportingId', 'Reporting ID', 'reportingId'),
  player('playerSidebar', 'Show the Sidebar', 'sidebar', 'boolean'),
  player('playerStart', 'Start at (first item)', 'start'),
  player('playerView', 'View', 'pv', 'select', ['pipls', 'pipss', 'sbs']),
  player('playerVolume', 'Volume', 'volume', 'number'),

  // Widget style
  style('Widget', 'styleWidth', 'Width', 'width', 'text', '100%'),
  style('Widget', 'styleHeight', 'Height', 'height', 'text', 'auto'),
  style('Widget', 'styleBorderRadius', 'Border Radius', 'borderRadius', 'text', '0'),
  style('Widget', 'styleGap', 'Gap (between the rows)', 'gap', 'text', '0'),

  // Player style
  style('Player', 'stylePlayerAspectRatio', 'Aspect Ratio', 'player.aspectRatio', 'text', 'the presentation\'s'),
  style('Player', 'stylePlayerBackgroundColor', 'Background Color', 'player.backgroundColor', 'color', '#000'),
  style('Player', 'stylePlayerMaxHeight', 'Max Height', 'player.maxHeight', 'text', 'none'),
  style('Player', 'stylePlayButtonBackgroundColor', 'Play Button: Background Color', 'player.playButton.backgroundColor', 'color', 'rgb(0 0 0 / .8)'),
  style('Player', 'stylePlayButtonColor', 'Play Button: Color', 'player.playButton.color', 'color', '#fff'),
  style('Player', 'stylePlayButtonHoverBackgroundColor', 'Play Button: Background Color (hover state)', 'player.playButton.hoverBackgroundColor', 'color', '#000'),
  style('Player', 'stylePlayButtonHoverColor', 'Play Button: Color (hover state)', 'player.playButton.hoverColor', 'color', '#fff'),
  style('Player', 'stylePlayButtonBorderRadius', 'Play Button: Border Radius', 'player.playButton.borderRadius', 'text', '100%'),
  style('Player', 'stylePlayButtonPosition', 'Play Button: Position', 'player.playButton.position', 'select', 'center', positions),
  style('Player', 'stylePlayButtonHeight', 'Play Button: Height', 'player.playButton.height', 'text', '44px'),
  style('Player', 'stylePlayButtonWidth', 'Play Button: Width', 'player.playButton.width', 'text', '44px'),

  // Control bar style
  style('Control Bar', 'styleControlsGeneralBackgroundColor', 'General: Background Color', 'controls.general.backgroundColor', 'color', '#09091a'),
  style('Control Bar', 'styleControlsGeneralColor', 'General: Color', 'controls.general.color', 'color', '#f5f8fa'),
  style('Control Bar', 'styleControlsPrimaryBackgroundColor', 'Primary: Background Color', 'controls.primary.backgroundColor', 'color', '#00b0ff'),
  style('Control Bar', 'styleControlsPrimaryColor', 'Primary: Color', 'controls.primary.color', 'color', '#013b55'),
  style('Control Bar', 'styleControlsFontFamily', 'Font Family', 'controls.fontFamily', 'text', 'inherit'),
  style('Control Bar', 'styleControlsFontSize', 'Font Size', 'controls.fontSize', 'text', '12px'),
  style('Control Bar', 'styleControlsGap', 'Gap', 'controls.gap', 'text', '4px'),
  style('Control Bar', 'styleControlsPadding', 'Padding', 'controls.padding', 'text', '8px 12px'),
  style('Control Bar', 'styleButtonsIconSize', 'Buttons: Icon Size', 'controls.buttons.iconSize', 'text', '28px'),
  style('Control Bar', 'styleButtonsSize', 'Buttons: Size', 'controls.buttons.size', 'text', '36px'),
  style('Control Bar', 'styleMenuBorderRadius', 'Menus: Border Radius', 'controls.menu.borderRadius', 'text', '10px'),
  style('Control Bar', 'styleTimelineHeight', 'Timeline: Height', 'controls.timeline.height', 'text', '4px'),

  // List style
  style('List', 'styleListBackgroundColor', 'Background Color', 'list.backgroundColor', 'color', 'transparent'),
  style('List', 'styleListMaxHeight', 'Max Height', 'list.maxHeight', 'text', 'none'),

  // Row style
  style('Row', 'styleItemBackgroundColor', 'Background Color', 'item.backgroundColor', 'color', 'transparent'),
  style('Row', 'styleItemHoverBackgroundColor', 'Background Color (hover state)', 'item.hoverBackgroundColor', 'color', 'light-dark(rgb(0 0 0 / .05), rgb(255 255 255 / .08))'),
  style('Row', 'styleItemActiveBackgroundColor', 'Background Color (current item)', 'item.activeBackgroundColor', 'color', 'light-dark(rgb(0 0 0 / .1), rgb(255 255 255 / .16))'),
  style('Row', 'styleItemActiveColor', 'Color (current item)', 'item.activeColor', 'color', 'inherit'),
  style('Row', 'styleItemWatchedColor', 'Color (watched items)', 'item.watchedColor', 'color', 'light-dark(rgb(0 0 0 / .6), rgb(255 255 255 / .6))'),
  style('Row', 'styleItemStatusIconColor', 'Status Icon Color', 'item.statusIconColor', 'color', 'currentColor'),
  style('Row', 'styleItemBorder', 'Border', 'item.border', 'text', 'none'),
  style('Row', 'styleItemHoverBorder', 'Border (hover state)', 'item.hoverBorder'),
  style('Row', 'styleItemActiveBorder', 'Border (pressed state)', 'item.activeBorder'),
  style('Row', 'styleItemBorderRadius', 'Border Radius', 'item.borderRadius', 'text', '0'),
  style('Row', 'styleItemBoxShadow', 'Box Shadow', 'item.boxShadow', 'text', 'none'),
  style('Row', 'styleItemPadding', 'Padding', 'item.padding', 'text', '8px 12px'),
  style('Row', 'styleItemFieldGap', 'Field Gap', 'item.fieldGap', 'text', '2px'),

  // Row fields style
  {
    arg: 'styleItemMetadata',
    category: 'Style',
    control: 'object',
    name: 'Per Field Style (item.metadata)',
    subcategory: 'Row Fields',
  },

  // Not found style, shared with the other widgets
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
export function getPlaygroundConfigurationFromArgs(args: Partial<Args>): Omit<PlaylistWidgetConfiguration, 'selector'> {
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

    setPath(configuration, path, value);
  });

  if (args.info && Object.keys(args.info).length) {
    setPath(configuration, 'widgetOptions.item.info', args.info);
  }

  if (args.styleItemMetadata && Object.keys(args.styleItemMetadata).length) {
    setPath(configuration, 'widgetOptions.style.item.metadata', args.styleItemMetadata);
  }

  return configuration as unknown as Omit<PlaylistWidgetConfiguration, 'selector'>;
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
    <title>Playlist Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PlaylistWidget } from 'https://unpkg.com/@qumu/widgets@${version}/dist/playlist-widget.js';

      PlaylistWidget.create(${json}).catch((err) => console.log(err));
    </script>
  </body>
</html>`;
}
