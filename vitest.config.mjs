/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.stories.js', // Storybook stories
        'stories/**/*.mdx', // Storybook readmes
        'html/**', // Vitest HTML reporter UI
        'tools/**', // EDS tooling directory
        'scripts/**', // EDS Build/utility scripts
        '!scripts/utils/**', // Include the utilities folder within scripts
        ...coverageConfigDefaults.exclude,
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  plugins: [mdx()],
});
