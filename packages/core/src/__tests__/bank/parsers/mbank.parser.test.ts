import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MbankParser } from '../../../bank/parsers/mbank.parser.js'

const fixtureFile = join(import.meta.dirname, '../../../../../../tests/fixtures/csv/mbank-sample.csv')

describe('MbankParser', () => {
  const parser = new MbankParser()

  it('detects mBank CSV', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    expect(await parser.canParse(content)).toBe(true)
  })

  it('does not detect non-mBank content', async () => {
    expect(await parser.canParse('random data')).toBe(false)
  })

  it('parses mBank fixture into 5 transactions', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs).toHaveLength(5)
  })

  it('extracts correct amount in grosze', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.amount).toBe(-123000)
  })

  it('extracts dates correctly', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.date).toBe('2026-03-01')
  })

  it('sets bank to mbank', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    for (const tx of txs) {
      expect(tx.bank).toBe('mbank')
    }
  })

  it('extracts counterparty name', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.recipientName).toBe('TECHSOLUTIONS SP Z OO')
  })
})
