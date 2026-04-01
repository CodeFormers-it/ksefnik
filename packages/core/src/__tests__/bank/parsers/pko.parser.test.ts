import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PkoParser } from '../../../bank/parsers/pko.parser.js'

const fixtureFile = join(import.meta.dirname, '../../../../../../tests/fixtures/csv/pko-sample.csv')

describe('PkoParser', () => {
  const parser = new PkoParser()

  it('detects PKO CSV', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    expect(await parser.canParse(content)).toBe(true)
  })

  it('parses PKO fixture into 4 transactions', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs).toHaveLength(4)
  })

  it('parses amounts with dot decimal separator', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.amount).toBe(-123000)
    expect(txs[1]!.amount).toBe(1500000)
  })

  it('extracts NIP from dedicated column', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.recipientNIP).toBe('5213456784')
  })

  it('sets bank to pko', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    for (const tx of txs) {
      expect(tx.bank).toBe('pko')
    }
  })
})
