import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    projects: [
      'packages/*',
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globals: true,
        },
        resolve: {
          alias: {
            '@ksefnik/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
            '@ksefnik/core': resolve(__dirname, 'packages/core/src/index.ts'),
            '@ksefnik/simulator': resolve(__dirname, 'packages/simulator/src/index.ts'),
            '@ksefnik/mcp': resolve(__dirname, 'packages/mcp/src/index.ts'),
            '@ksefnik/cli': resolve(__dirname, 'packages/cli/src/index.ts'),
          },
        },
      },
    ],
  },
})
