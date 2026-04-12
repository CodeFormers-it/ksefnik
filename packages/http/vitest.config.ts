import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@ksefnik/shared': resolve(__dirname, '../shared/src/index.ts'),
      '@ksefnik/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
})
