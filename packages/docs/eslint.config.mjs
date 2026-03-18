import { defineConfig } from 'eslint/config';
import { javascript, typescript } from '@qumu/eslint-config';

export default defineConfig([
  {
    ignores: ['storybook-static/**/*'],
  },
  {
    extends: [javascript],
    files: ['**/*.js'],
  },
  {
    extends: [typescript],
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/.storybook/*.ts'], // exclude Storybook files
    rules: {
      'no-console': 'off',
    },
  },
]);
