import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { exactPass } from '../../../matching/passes/exact.pass.js'

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    invoiceNumber: 'FV/2026/03/001',
    sellerNIP: '5213456784',
    grossAmount: 123000,
    currency: 'PLN',
    issueDate: '2026-03-01',
    createdAt: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

function makeTx(overrides: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id: 'tx-1',
    date: '2026-03-01',
    amount: -123000,
    description: 'FV/2026/03/001 NIP5213456784',
    recipientNIP: '5213456784',
    bank: 'mbank',
    raw: 'raw',
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

describe('exact pass', () => {
  it('matches by exact amount + NIP', async () => {
    const results = await exactPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx()],
      alreadyMatched: [],
    })

    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(95)
  })

  it('no match when amount differs', async () => {
    const results = await exactPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx({ amount: -120000 })],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when NIP differs', async () => {
    const results = await exactPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx({ recipientNIP: '7740001454', description: 'NIP7740001454' })],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('extracts NIP from description when not in fields', async () => {
    const results = await exactPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx({ recipientNIP: undefined, senderNIP: undefined, description: 'Przelew NIP5213456784' })],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
  })

  it('matches positive amount (incoming)', async () => {
    const results = await exactPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx({ amount: 123000, senderNIP: '5213456784', recipientNIP: undefined })],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
  })
})
