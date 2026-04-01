#!/usr/bin/env node
/**
 * Build script for compiling ksefnik CLI into a standalone binary using Bun.
 * Usage: bun run apps/build/build.ts
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(import.meta.dirname, '../../dist-bin')

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true })
}

console.log('Building ksefnik binary...')

try {
  execSync(
    `bun build packages/cli/src/main.ts --compile --outfile ${join(outDir, 'ksefnik')}`,
    { stdio: 'inherit', cwd: join(import.meta.dirname, '../..') },
  )
  console.log(`Binary compiled to: ${join(outDir, 'ksefnik')}`)
} catch (error) {
  console.error('Binary compilation failed. Make sure Bun is installed.')
  console.error('Install: curl -fsSL https://bun.sh/install | bash')
  process.exit(1)
}
