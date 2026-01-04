import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 2,
      env,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        '**/*.json',
        'src/locales/**',
        'src/firebase/config.ts',
        'src/firebase/index.ts',
        'src/firebase/utils.ts',
        'src/firebase/non-blocking-updates.ts',
        'src/firebase/error-emitter.ts',
        'src/firebase/errors.ts',
        'src/components/ui/**',
        'src/components/chat-typing-indicator.tsx',
        'src/components/journal-loading-state.tsx',
        'src/components/chat-empty-state.tsx',
        'src/components/moods-badge.tsx',
        'src/components/places-badge.tsx',
        'src/components/themes-badge.tsx',
        'src/components/characters-badge.tsx',
        'src/components/journal-sidebar/**',
        'src/app/page.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  };
});

