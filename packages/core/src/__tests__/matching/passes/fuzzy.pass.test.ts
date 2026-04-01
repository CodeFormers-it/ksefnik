import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { fuzzyPass } from '../../../matching/passes/fuzzy.pass.js'

const inv: Invoice = {
  id: 'inv-1', invoiceNumber: 'FV/2026/03/001', sellerNIP: '5213456784',
  sellerName: 'TECHSOLUTIONS SP Z OO',
  grossAmount: 123000, currency: 'PLN', issueDate: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
}

const tx: BankTransaction = {
  id: 'tx-1', date: '2026-03-01', amount: -123000,
  description: 'payment', senderName: 'TECHSOLUTIONS SP. Z O.O.',
  bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z',
}

describe('fuzzy pass', () => {
  it('matches by fuzzy name + exact amount', async () => {
    const results = await fuzzyPass.run({ invoices: [inv], transactions: [tx], alreadyMatched: [] })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(80)
  })

  it('no match when amount differs', async () => {
    const results = await fuzzyPass.run({
      invoices: [inv],
      transactions: [{ ...tx, amount: -100000 }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when names too different', async () => {
    const results = await fuzzyPass.run({
      invoices: [inv],
      transactions: [{ ...tx, senderName: 'COMPLETELY DIFFERENT COMPANY' }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when no sellerName', async () => {
    const results = await fuzzyPass.run({
      invoices: [{ ...inv, sellerName: undefined }],
      transactions: [tx],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })
})
