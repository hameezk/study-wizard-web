import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * The webhook suite runs the real route handler, so it needs the `@/` alias
 * that `tsconfig.json` provides to Next but Vitest does not read.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
  },
});
