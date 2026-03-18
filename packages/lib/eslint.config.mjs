import { defineConfig } from 'eslint/config';
import { javascript, typescript } from '@qumu/eslint-config';

export default defineConfig([
  {
    extends: [javascript],
    files: ['**/*.{js,mjs,cjs}'],
  },
  {
    extends: [typescript],
    files: ['**/*.ts'],
    ignores: ['**/*.d.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    extends: [typescript],
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-console': 'off',
    },
  },
]);
