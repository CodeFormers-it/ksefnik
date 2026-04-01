import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SantanderParser } from '../../../bank/parsers/santander.parser.js'

const fixtureFile = join(import.meta.dirname, '../../../../../../tests/fixtures/csv/santander-sample.csv')

describe('SantanderParser', () => {
  const parser = new SantanderParser()

  it('detects Santander CSV', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    expect(await parser.canParse(content)).toBe(true)
  })

  it('parses Santander fixture into 4 transactions', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs).toHaveLength(4)
  })

  it('converts DD-MM-YYYY dates to ISO format', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.date).toBe('2026-03-01')
  })

  it('extracts NIP from counterparty field', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.recipientNIP).toBe('5213456784')
  })

  it('cleans NIP from counterparty name', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    expect(txs[0]!.recipientName).toBe('TECHSOLUTIONS SP Z OO')
  })

  it('sets bank to santander', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const txs = await parser.parse(content)
    for (const tx of txs) {
      expect(tx.bank).toBe('santander')
    }
  })
})
