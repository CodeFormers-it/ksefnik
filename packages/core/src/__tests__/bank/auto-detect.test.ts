import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { detectBankFormat } from '../../bank/auto-detect.js'

const fixturesDir = join(import.meta.dirname, '../../../../../tests/fixtures')

describe('detectBankFormat', () => {
  it('detects MT940', () => {
    const content = readFileSync(join(fixturesDir, 'mt940/sample.mt940'), 'utf-8')
    expect(detectBankFormat(content)).toBe('mt940')
  })

  it('detects mBank CSV', () => {
    const content = readFileSync(join(fixturesDir, 'csv/mbank-sample.csv'), 'utf-8')
    expect(detectBankFormat(content)).toBe('mbank')
  })

  it('detects ING CSV', () => {
    const content = readFileSync(join(fixturesDir, 'csv/ing-sample.csv'), 'utf-8')
    expect(detectBankFormat(content)).toBe('ing')
  })

  it('detects PKO BP CSV', () => {
    const content = readFileSync(join(fixturesDir, 'csv/pko-sample.csv'), 'utf-8')
    expect(detectBankFormat(content)).toBe('pko')
  })

  it('detects Santander CSV', () => {
    const content = readFileSync(join(fixturesDir, 'csv/santander-sample.csv'), 'utf-8')
    expect(detectBankFormat(content)).toBe('santander')
  })

  it('returns null for unknown format', () => {
    expect(detectBankFormat('random text without bank headers')).toBeNull()
  })
})
