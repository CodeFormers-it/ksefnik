import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { importBankStatement } from '../../bank/index.js'
import { UnsupportedBankFormatError } from '@ksefnik/shared'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'

const fixturesDir = join(import.meta.dirname, '../../../../../tests/fixtures')

describe('importBankStatement', () => {
  it('auto-detects and parses MT940', async () => {
    const txs = await importBankStatement(join(fixturesDir, 'mt940/sample.mt940'))
    expect(txs.length).toBeGreaterThan(0)
    expect(txs[0]!.bank).toBe('mt940')
  })

  it('auto-detects and parses mBank CSV', async () => {
    const txs = await importBankStatement(join(fixturesDir, 'csv/mbank-sample.csv'))
    expect(txs).toHaveLength(5)
    expect(txs[0]!.bank).toBe('mbank')
  })

  it('auto-detects and parses ING CSV', async () => {
    const txs = await importBankStatement(join(fixturesDir, 'csv/ing-sample.csv'))
    expect(txs).toHaveLength(4)
    expect(txs[0]!.bank).toBe('ing')
  })

  it('auto-detects and parses PKO CSV', async () => {
    const txs = await importBankStatement(join(fixturesDir, 'csv/pko-sample.csv'))
    expect(txs).toHaveLength(4)
    expect(txs[0]!.bank).toBe('pko')
  })

  it('auto-detects and parses Santander CSV', async () => {
    const txs = await importBankStatement(join(fixturesDir, 'csv/santander-sample.csv'))
    expect(txs).toHaveLength(4)
    expect(txs[0]!.bank).toBe('santander')
  })

  it('throws UnsupportedBankFormatError for unknown format', async () => {
    const tmpFile = join(tmpdir(), `test-unknown-${Date.now()}.txt`)
    writeFileSync(tmpFile, 'random unknown content')
    try {
      await expect(importBankStatement(tmpFile)).rejects.toThrow(UnsupportedBankFormatError)
    } finally {
      unlinkSync(tmpFile)
    }
  })
})
