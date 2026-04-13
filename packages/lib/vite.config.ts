import { defineConfig } from 'vite';
import path from 'node:path';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
        'list-widget': path.resolve(__dirname, './src/widgets/list-widget.tsx'),
        'presentation-widget': path.resolve(__dirname, './src/widgets/presentation-widget.tsx'),
      },
      fileName: (_, name) => `${name}.js`,
      formats: ['es'],
      name: 'Qumu Widget',
    },
    minify: 'terser',
  },
  plugins: [
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/icons')],
    }),
    dts({
      rollupTypes: true,
    }),
    viteStaticCopy({
      targets: [
        {
          dest: '', // copy directly to dist root
          src: path.resolve(__dirname, 'src/locales'),
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
