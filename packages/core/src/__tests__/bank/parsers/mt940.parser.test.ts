import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Mt940Parser } from '../../../bank/parsers/mt940.parser.js'

const fixtureFile = join(import.meta.dirname, '../../../../../../tests/fixtures/mt940/sample.mt940')

describe('Mt940Parser', () => {
  const parser = new Mt940Parser()

  it('detects MT940 content', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    expect(await parser.canParse(content)).toBe(true)
  })

  it('does not detect non-MT940 content', async () => {
    expect(await parser.canParse('random csv data')).toBe(false)
  })

  it('parses MT940 fixture into transactions', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    expect(transactions.length).toBeGreaterThanOrEqual(5)
  })

  it('extracts amounts in grosze', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    // First transaction: D1230,00 = -123000 grosze
    const first = transactions[0]!
    expect(first.amount).toBe(-123000)
  })

  it('extracts dates as ISO strings', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    expect(transactions[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('sets bank to mt940', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    for (const tx of transactions) {
      expect(tx.bank).toBe('mt940')
    }
  })

  it('extracts NIP from details', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    // First transaction has NIP5213456784 in details
    const first = transactions[0]!
    expect(first.recipientNIP ?? first.senderNIP).toBe('5213456784')
  })

  it('extracts beneficiary name from ~27 subfield', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    const first = transactions[0]!
    expect(first.recipientName ?? first.senderName).toBe('TECHSOLUTIONS SP Z OO')
  })

  it('has required fields on every transaction', async () => {
    const content = readFileSync(fixtureFile, 'utf-8')
    const transactions = await parser.parse(content)

    for (const tx of transactions) {
      expect(tx.id).toBeDefined()
      expect(tx.date).toBeDefined()
      expect(typeof tx.amount).toBe('number')
      expect(tx.description).toBeDefined()
      expect(tx.bank).toBe('mt940')
      expect(tx.raw).toBeDefined()
      expect(tx.createdAt).toBeDefined()
    }
  })
})
