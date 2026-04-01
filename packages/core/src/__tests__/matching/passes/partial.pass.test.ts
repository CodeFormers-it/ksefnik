import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { partialPass } from '../../../matching/passes/partial.pass.js'

const inv: Invoice = {
  id: 'inv-1', invoiceNumber: 'FV/001', sellerNIP: '5213456784',
  grossAmount: 100000, currency: 'PLN', issueDate: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
}

function makeTx(id: string, amount: number): BankTransaction {
  return {
    id, date: '2026-03-01', amount, description: 'payment',
    senderNIP: '5213456784', bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z',
  }
}

describe('partial pass', () => {
  it('matches multiple transactions summing to invoice amount', async () => {
    const results = await partialPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -60000), makeTx('tx-2', -40000)],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
    expect(results[0]!.transactionIds).toHaveLength(2)
    expect(results[0]!.confidence).toBe(70)
  })

  it('matches with 95%+ coverage', async () => {
    const results = await partialPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -60000), makeTx('tx-2', -36000)],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(1)
    expect(results[0]!.confidence).toBe(50)
  })

  it('no match when coverage < 95%', async () => {
    const results = await partialPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -30000), makeTx('tx-2', -20000)],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match with single transaction', async () => {
    const results = await partialPass.run({
      invoices: [inv],
      transactions: [makeTx('tx-1', -100000)],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })

  it('no match when NIP does not match', async () => {
    const tx: BankTransaction = {
      id: 'tx-1', date: '2026-03-01', amount: -60000, description: 'p',
      senderNIP: '7740001454', bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z',
    }
    const results = await partialPass.run({
      invoices: [inv],
      transactions: [tx, { ...tx, id: 'tx-2', amount: -40000 }],
      alreadyMatched: [],
    })
    expect(results).toHaveLength(0)
  })
})
