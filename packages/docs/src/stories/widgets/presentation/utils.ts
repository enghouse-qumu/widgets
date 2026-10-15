import type { PlayerParameters, WidgetConfiguration, WidgetOptions, WidgetStyle } from 'lib';

export interface Args {
  host: WidgetConfiguration['host'];
  guid: WidgetConfiguration['guid'];
  selector: WidgetConfiguration['selector'];
  playbackMode: WidgetOptions['playbackMode'];
  playIconUrl: WidgetOptions['playIconUrl'];
  playerAudio: PlayerParameters['audio'];
  playerCaptions: PlayerParameters['captions'];
  playerConfigurationGuid: PlayerParameters['playerConfigurationGuid'];
  playerDebug: PlayerParameters['debug'];
  playerLoop: PlayerParameters['loop'];
  playerView: PlayerParameters['pv'];
  playerQuality: PlayerParameters['quality'];
  playerReporting: PlayerParameters['reporting'];
  playerReportingId: PlayerParameters['reportingId'];
  playerShowControlPanel: PlayerParameters['showControlPanel'];
  playerSidebar: PlayerParameters['sidebar'];
  playerStart: PlayerParameters['start'];
  playerVolume: PlayerParameters['volume'];
  styleBorderRadius: WidgetStyle['borderRadius'];
  styleCloseButtonActiveBackgroundColor: WidgetStyle['closeButton']['activeBackgroundColor'];
  styleCloseButtonActiveColor: WidgetStyle['closeButton']['activeColor'];
  styleCloseButtonBackgroundColor: WidgetStyle['closeButton']['backgroundColor'];
  styleCloseButtonBorderRadius: WidgetStyle['closeButton']['borderRadius'];
  styleCloseButtonBoxShadow: WidgetStyle['closeButton']['boxShadow'];
  styleCloseButtonColor: WidgetStyle['closeButton']['color'];
  styleCloseButtonHoverBackgroundColor: WidgetStyle['closeButton']['hoverBackgroundColor'];
  styleCloseButtonHoverColor: WidgetStyle['closeButton']['hoverColor'];
  styleCloseButtonIconSize: WidgetStyle['closeButton']['iconSize'];
  styleCloseButtonPadding: WidgetStyle['closeButton']['padding'];
  styleDialogBackdropColor: WidgetStyle['dialog']['backdropColor'];
  styleDialogBackgroundColor: WidgetStyle['dialog']['backgroundColor'];
  styleDialogBorder: WidgetStyle['dialog']['border'];
  styleDialogBorderRadius: WidgetStyle['dialog']['borderRadius'];
  styleDialogMaxWidth: WidgetStyle['dialog']['maxWidth'];
  styleDialogPadding: WidgetStyle['dialog']['padding'];
  styleDialogWidth: WidgetStyle['dialog']['width'];
  styleHeight: WidgetStyle['height'];
  styleNotFoundBackgroundColor: WidgetStyle['notFound']['backgroundColor'];
  styleNotFoundBorder: WidgetStyle['notFound']['border'];
  styleNotFoundColor: WidgetStyle['notFound']['color'];
  styleNotFoundIconColor: WidgetStyle['notFound']['iconColor'];
  stylePlayButtonActiveBackgroundColor: WidgetStyle['playButton']['activeBackgroundColor'];
  stylePlayButtonActiveColor: WidgetStyle['playButton']['activeColor'];
  stylePlayButtonBackgroundColor: WidgetStyle['playButton']['backgroundColor'];
  stylePlayButtonBorderRadius: WidgetStyle['playButton']['borderRadius'];
  stylePlayButtonColor: WidgetStyle['playButton']['color'];
  stylePlayButtonHoverBackgroundColor: WidgetStyle['playButton']['hoverBackgroundColor'];
  stylePlayButtonHoverColor: WidgetStyle['playButton']['hoverColor'];
  stylePlayButtonMargin: WidgetStyle['playButton']['margin'];
  stylePlayButtonPadding: WidgetStyle['playButton']['padding'];
  stylePlayButtonPosition: WidgetStyle['playButton']['position'];
  stylePlayButtonHeight: WidgetStyle['playButton']['height'];
  stylePlayButtonWidth: WidgetStyle['playButton']['width'];
  styleThumbnailImageFit: WidgetStyle['thumbnail']['imageFit'];
  styleWidth: WidgetStyle['width'];
}

/**
 * Get the configuration object from the story context.
 *
 * @param args the arguments from the story context
 */
export function getPlaygroundConfigurationFromArgs(args: Partial<Args>): Omit<WidgetConfiguration, 'selector'> {
  const style: Partial<WidgetStyle> = {};

  if (args.styleBorderRadius) {
    style.borderRadius = args.styleBorderRadius;
  }

  if (args.styleHeight) {
    style.height = args.styleHeight;
  }

  if (args.styleWidth) {
    style.width = args.styleWidth;
  }

  const closeButton: Partial<WidgetStyle['closeButton']> = {};

  if (args.styleCloseButtonActiveBackgroundColor) {
    closeButton.activeBackgroundColor = args.styleCloseButtonActiveBackgroundColor;
  }

  if (args.styleCloseButtonActiveColor) {
    closeButton.activeColor = args.styleCloseButtonActiveColor;
  }

  if (args.styleCloseButtonBackgroundColor) {
    closeButton.backgroundColor = args.styleCloseButtonBackgroundColor;
  }

  if (args.styleCloseButtonBorderRadius) {
    closeButton.borderRadius = args.styleCloseButtonBorderRadius;
  }

  if (args.styleCloseButtonBoxShadow) {
    closeButton.boxShadow = args.styleCloseButtonBoxShadow;
  }

  if (args.styleCloseButtonColor) {
    closeButton.color = args.styleCloseButtonColor;
  }

  if (args.styleCloseButtonHoverBackgroundColor) {
    closeButton.hoverBackgroundColor = args.styleCloseButtonHoverBackgroundColor;
  }

  if (args.styleCloseButtonHoverColor) {
    closeButton.hoverColor = args.styleCloseButtonHoverColor;
  }

  if (args.styleCloseButtonIconSize) {
    closeButton.iconSize = args.styleCloseButtonIconSize;
  }

  if (args.styleCloseButtonPadding) {
    closeButton.padding = args.styleCloseButtonPadding;
  }

  if (Object.keys(closeButton).length) {
    style.closeButton = closeButton;
  }

  const dialog: Partial<WidgetStyle['dialog']> = {};

  if (args.styleDialogBackdropColor) {
    dialog.backdropColor = args.styleDialogBackdropColor;
  }

  if (args.styleDialogBackgroundColor) {
    dialog.backgroundColor = args.styleDialogBackgroundColor;
  }

  if (args.styleDialogBorder) {
    dialog.border = args.styleDialogBorder;
  }

  if (args.styleDialogBorderRadius) {
    dialog.borderRadius = args.styleDialogBorderRadius;
  }

  if (args.styleDialogMaxWidth) {
    dialog.maxWidth = args.styleDialogMaxWidth;
  }

  if (args.styleDialogPadding) {
    dialog.padding = args.styleDialogPadding;
  }

  if (args.styleDialogWidth) {
    dialog.width = args.styleDialogWidth;
  }

  if (Object.keys(dialog).length) {
    style.dialog = dialog;
  }

  const playButton: Partial<WidgetStyle['playButton']> = {};

  if (args.stylePlayButtonActiveBackgroundColor) {
    playButton.activeBackgroundColor = args.stylePlayButtonActiveBackgroundColor;
  }

  if (args.stylePlayButtonActiveColor) {
    playButton.activeColor = args.stylePlayButtonActiveColor;
  }

  if (args.stylePlayButtonBackgroundColor) {
    playButton.backgroundColor = args.stylePlayButtonBackgroundColor;
  }

  if (args.stylePlayButtonBorderRadius) {
    playButton.borderRadius = args.stylePlayButtonBorderRadius;
  }

  if (args.stylePlayButtonColor) {
    playButton.color = args.stylePlayButtonColor;
  }

  if (args.stylePlayButtonHoverBackgroundColor) {
    playButton.hoverBackgroundColor = args.stylePlayButtonHoverBackgroundColor;
  }

  if (args.stylePlayButtonHoverColor) {
    playButton.hoverColor = args.stylePlayButtonHoverColor;
  }

  if (args.stylePlayButtonMargin) {
    playButton.margin = args.stylePlayButtonMargin;
  }

  if (args.stylePlayButtonPadding) {
    playButton.padding = args.stylePlayButtonPadding;
  }

  if (args.stylePlayButtonPosition) {
    playButton.position = args.stylePlayButtonPosition;
  }

  if (args.stylePlayButtonHeight) {
    playButton.height = args.stylePlayButtonHeight;
  }

  if (args.stylePlayButtonWidth) {
    playButton.width = args.stylePlayButtonWidth;
  }

  if (Object.keys(playButton).length) {
    style.playButton = playButton;
  }

  const thumbnail: Partial<WidgetStyle['thumbnail']> = {};

  if (args.styleThumbnailImageFit) {
    thumbnail.imageFit = args.styleThumbnailImageFit;
  }

  if (Object.keys(thumbnail).length) {
    style.thumbnail = thumbnail;
  }

  const notFound: Partial<WidgetStyle['notFound']> = {};

  if (args.styleNotFoundBackgroundColor) {
    notFound.backgroundColor = args.styleNotFoundBackgroundColor;
  }

  if (args.styleNotFoundBorder) {
    notFound.border = args.styleNotFoundBorder;
  }

  if (args.styleNotFoundColor) {
    notFound.color = args.styleNotFoundColor;
  }

  if (args.styleNotFoundIconColor) {
    notFound.iconColor = args.styleNotFoundIconColor;
  }

  if (Object.keys(notFound).length) {
    style.notFound = notFound;
  }

  const playerParameters: Partial<PlayerParameters> = {};

  if (args.playerAudio !== undefined) {
    playerParameters.audio = args.playerAudio;
  }

  if (args.playerCaptions !== undefined) {
    playerParameters.captions = args.playerCaptions;
  }

  if (args.playerConfigurationGuid !== undefined) {
    playerParameters.playerConfigurationGuid = args.playerConfigurationGuid;
  }

  if (args.playerDebug !== undefined) {
    playerParameters.debug = args.playerDebug;
  }

  if (args.playerLoop !== undefined) {
    playerParameters.loop = args.playerLoop;
  }

  if (args.playerView !== undefined) {
    playerParameters.pv = args.playerView;
  }

  if (args.playerQuality !== undefined) {
    playerParameters.quality = args.playerQuality;
  }

  if (args.playerReporting !== undefined) {
    playerParameters.reporting = args.playerReporting;
  }

  if (args.playerReportingId !== undefined) {
    playerParameters.reportingId = args.playerReportingId;
  }

  if (args.playerShowControlPanel !== undefined) {
    playerParameters.showControlPanel = args.playerShowControlPanel;
  }

  if (args.playerSidebar !== undefined) {
    playerParameters.sidebar = args.playerSidebar;
  }

  if (args.playerStart !== undefined) {
    playerParameters.start = args.playerStart;
  }

  if (args.playerVolume !== undefined) {
    playerParameters.volume = args.playerVolume;
  }

  const widgetOptions: Partial<WidgetOptions> = {};

  if (args.playbackMode !== undefined) {
    widgetOptions.playbackMode = args.playbackMode;
  }

  if (args.playIconUrl) {
    widgetOptions.playIconUrl = args.playIconUrl;
  }

  if (Object.keys(style).length) {
    widgetOptions.style = style;
  }

  /* eslint-disable sort-keys */
  const configuration: Omit<WidgetConfiguration, 'selector'> = {
    host: args.host!,
    guid: args.guid!,
  };

  /* eslint-enable sort-keys */
  if (Object.keys(playerParameters).length) {
    configuration.playerParameters = playerParameters;
  }

  if (Object.keys(widgetOptions).length) {
    configuration.widgetOptions = widgetOptions;
  }

  return configuration;
}
