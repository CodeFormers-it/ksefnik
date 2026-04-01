import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { proximityPass } from '../../../matching/passes/proximity.pass.js'

const inv: Invoice = {
  id: 'inv-1', invoiceNumber: 'FV/001', sellerNIP: '5213456784',
  grossAmount: 100000, currency: 'PLN', issueDate: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
}

function makeTx(id: string, amount: number, date: string): BankTransaction {
  return {
    id, date, amount, description: 'payment',
    bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z',
  }
}

describe('proximity pass', () => {
  it('matches amount within 5% and date within 30 days', async () => {
    const results = await proximityPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -102000, '2026-03-05')],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBeGreaterThanOrEqual(50)
    expect(results[0]!.confidence).toBeLessThanOrEqual(70)
  })

  it('higher confidence for closer dates', async () => {
    const r1 = await proximityPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -100000, '2026-03-02')],
      alreadyMatched: [],
    })
    const r2 = await proximityPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -100000, '2026-03-25')],
      alreadyMatched: [],
    })
    expect(r1[0]!.confidence).toBeGreaterThan(r2[0]!.confidence)
  })

  it('no match when amount outside 5%', async () => {
    const results = await proximityPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -110000, '2026-03-02')],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when date > 30 days', async () => {
    const results = await proximityPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -100000, '2026-05-01')],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('uses dueDate when available', async () => {
    const invWithDue = { ...inv, dueDate: '2026-03-15' }
    const results = await proximityPass.run({
      invoices: [invWithDue],
      transactions: [makeTx('tx-1', -100000, '2026-03-14')],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBeGreaterThan(65) // very close to dueDate
  })
})
