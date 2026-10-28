import { create } from 'storybook/theming';
import logo from './logo.svg';

// https://storybook.js.org/docs/configurations/theming/
export default create({
  appBorderRadius: 8,
  base: 'light',
  brandImage: logo,
  brandTitle: 'Qumu Widgets',
});
