import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction, Match } from '@ksefnik/shared'
import { ksefRefPass } from '../../../matching/passes/ksef-ref.pass.js'

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    invoiceNumber: 'FV/2026/03/005',
    sellerNIP: '7740001454',
    grossAmount: 2250000,
    currency: 'PLN',
    issueDate: '2026-03-15',
    ksefReference: '1234567890-20260315-ABC123DEF456',
    createdAt: '2026-03-15T10:00:00Z',
    ...overrides,
  }
}

function makeTx(overrides: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id: 'tx-1',
    date: '2026-03-15',
    amount: 2250000,
    description: 'Zaplata za FV/2026/03/005 KSeF:1234567890-20260315-ABC123DEF456',
    bank: 'mbank',
    raw: 'raw',
    createdAt: '2026-03-15T12:00:00Z',
    ...overrides,
  }
}

describe('ksef-ref pass', () => {
  it('matches by KSeF reference in description', async () => {
    const results = await ksefRefPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx()],
      alreadyMatched: [],
    })

    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(99)
    expect(results[0]!.invoiceId).toBe('inv-1')
    expect(results[0]!.transactionId).toBe('tx-1')
  })

  it('case-insensitive match', async () => {
    const results = await ksefRefPass.run({
      invoices: [makeInvoice({ ksefReference: '1234567890-20260315-abc123def456' })],
      transactions: [makeTx()],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
  })

  it('skips invoices without ksefReference', async () => {
    const results = await ksefRefPass.run({
      invoices: [makeInvoice({ ksefReference: undefined })],
      transactions: [makeTx()],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when reference not in description', async () => {
    const results = await ksefRefPass.run({
      invoices: [makeInvoice()],
      transactions: [makeTx({ description: 'Przelew za uslugi' })],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })
})
