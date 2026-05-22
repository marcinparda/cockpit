/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/habits',
  server: {
    port: 4208,
    host: 'localhost',
  },
  preview: {
    port: 4308,
    host: 'localhost',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    tailwindcss(),
  ],
  build: {
    outDir: '../../dist/apps/habits',
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
      reportsDirectory: '../../coverage/apps/habits',
      provider: 'v8' as const,
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/app/router.tsx',
        'src/api/hooks/**',
        'src/api/endpoints.ts',
        'src/api/schemas.ts',
        // Drag-and-drop wrapper components: dnd-kit context callbacks
        // cannot be meaningfully unit tested without a full DnD simulator
        'src/components/SortableCategoryGroup.tsx',
        'src/components/SortableHabitRow.tsx',
        'src/components/ConfettiAnimation.tsx',
      ],
      reporter: ['text-summary', 'lcov'],
    },
    setupFiles: './setupTests.ts',
  },
}));
