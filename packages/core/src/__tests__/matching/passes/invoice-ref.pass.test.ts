import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { invoiceRefPass } from '../../../matching/passes/invoice-ref.pass.js'

const inv: Invoice = {
  id: 'inv-1', invoiceNumber: 'FV/2026/03/001', sellerNIP: '5213456784',
  grossAmount: 123000, currency: 'PLN', issueDate: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
}

const tx: BankTransaction = {
  id: 'tx-1', date: '2026-03-01', amount: -123000,
  description: 'FV/2026/03/001 za uslugi', bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z',
}

describe('invoice-ref pass', () => {
  it('matches by invoice number + amount → confidence 90', async () => {
    const results = await invoiceRefPass.run({ invoices: [inv], transactions: [tx], alreadyMatched: [] })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(90)
  })

  it('matches by invoice number only → confidence 75', async () => {
    const results = await invoiceRefPass.run({
      invoices: [inv],
      transactions: [{ ...tx, amount: -100000 }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(75)
  })

  it('no match when number not in description', async () => {
    const results = await invoiceRefPass.run({
      invoices: [inv],
      transactions: [{ ...tx, description: 'random payment' }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('case-insensitive matching', async () => {
    const results = await invoiceRefPass.run({
      invoices: [inv],
      transactions: [{ ...tx, description: 'fv/2026/03/001 payment' }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
  })
})
