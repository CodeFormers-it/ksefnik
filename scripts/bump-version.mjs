#!/usr/bin/env node
// Bumps versions in all packages/*/package.json.
// Usage: node scripts/bump-version.mjs <patch|minor|major>

import fs from 'node:fs'
import path from 'node:path'

const bumpType = process.argv[2]
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: bump-version.mjs <patch|minor|major>')
  process.exit(1)
}

const PACKAGES = ['shared', 'core', 'http', 'simulator', 'mcp', 'cli']

function bump(version, type) {
  const [maj, min, pat] = version.split('.').map(Number)
  if (type === 'patch') return `${maj}.${min}.${pat + 1}`
  if (type === 'minor') return `${maj}.${min + 1}.0`
  return `${maj + 1}.0.0`
}

let nextVersion = null
for (const name of PACKAGES) {
  const file = path.join('packages', name, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  const next = bump(pkg.version, bumpType)
  pkg.version = next
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`@ksefnik/${name}: ${next}`)
  nextVersion ??= next
}

// Export next version for shell pipelines (CI reads stdout)
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${nextVersion}\n`)
}
