/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/cv',
  server: {
    port: 4204,
    host: 'localhost',
  },
  preview: {
    port: 4304,
    host: 'localhost',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    tailwindcss(),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../dist/apps/cv',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/cv',
      provider: 'v8' as const,
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/app/providers.tsx', 'src/app/skeleton.tsx', 'src/components/cv/cv.tsx'],
      reporter: ['text-summary', 'lcov'],
    },
    setupFiles: './setupTests.ts',
  },
}));
