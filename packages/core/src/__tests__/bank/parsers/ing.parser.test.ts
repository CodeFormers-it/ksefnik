import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IngParser } from '../../../bank/parsers/ing.parser.js'

const fixtureFile = join(import.meta.dirname, '../../../../../../tests/fixtures/csv/ing-sample.csv')

describe('IngParser', () => {
  const parser = new IngParser()

  it('detects ING CSV', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    expect(await parser.canParse(content)).toBe(true)
  })

  it('does not detect non-ING content', async () => {
    expect(await parser.canParse('random data')).toBe(false)
  })

  it('parses ING fixture into 4 transactions', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs).toHaveLength(4)
  })

  it('converts YYYYMMDD dates to ISO format', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.date).toBe('2026-03-01')
  })

  it('parses amounts with leading spaces and signs', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.amount).toBe(-123000)
    expect(txs[1]!.amount).toBe(1500000)
  })

  it('extracts NIP from details column', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.recipientNIP).toBe('5213456784')
  })

  it('sets bank to ing', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    for (const tx of txs) {
      expect(tx.bank).toBe('ing')
    }
  })
})
