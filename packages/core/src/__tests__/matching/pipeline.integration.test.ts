import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction } from '@ksefnik/shared'
import { runPipeline } from '../../matching/pipeline.js'
import { defaultPasses } from '../../matching/passes/index.js'

function inv(id: string, overrides: Partial<Invoice> = {}): Invoice {
  return {
    id, invoiceNumber: `FV/${id}`, sellerNIP: '5213456784',
    grossAmount: 123000, currency: 'PLN', issueDate: '2026-03-01',
    createdAt: '2026-03-01T10:00:00Z', ...overrides,
  }
}

function tx(id: string, overrides: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id, date: '2026-03-01', amount: -123000, description: 'payment',
    bank: 'mbank', raw: 'raw', createdAt: '2026-03-01T12:00:00Z', ...overrides,
  }
}

describe('Pipeline integration', () => {
  it('pass registry contains 6 passes in correct order', () => {
    expect(defaultPasses).toHaveLength(6)
    expect(defaultPasses.map((p) => p.order)).toEqual([100, 200, 300, 400, 450, 500])
    expect(defaultPasses.map((p) => p.name)).toEqual([
      'ksef-ref', 'exact', 'invoice-ref', 'fuzzy', 'partial', 'proximity',
    ])
  })

  it('matches KSeF reference with highest priority', async () => {
    const invoices = [
      inv('inv-ksef', {
        ksefReference: '9999-20260315-XYZABC',
        grossAmount: 2250000,
        sellerNIP: '7740001454',
      }),
    ]
    const transactions = [
      tx('tx-ksef', {
        amount: 2250000,
        description: 'FV/2026/03/005 KSeF:9999-20260315-XYZABC',
        senderNIP: '7740001454',
      }),
    ]

    const report = await runPipeline(invoices, transactions, defaultPasses)
    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('ksef-ref')
    expect(report.matched[0]!.confidence).toBe(99)
  })

  it('falls back to exact match when no KSeF ref', async () => {
    const invoices = [inv('inv-exact', { sellerNIP: '5213456784', grossAmount: 123000 })]
    const transactions = [
      tx('tx-exact', { amount: -123000, recipientNIP: '5213456784' }),
    ]

    const report = await runPipeline(invoices, transactions, defaultPasses)
    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('exact')
  })

  it('falls back to invoice-ref when no NIP match', async () => {
    const invoices = [inv('inv-ref', { invoiceNumber: 'FV/2026/03/001', sellerNIP: '5213456784' })]
    const transactions = [
      tx('tx-ref', { amount: -123000, description: 'FV/2026/03/001 za uslugi' }),
    ]

    const report = await runPipeline(invoices, transactions, defaultPasses)
    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('invoice-ref')
  })

  it('handles mixed scenario with multiple passes', async () => {
    const invoices = [
      inv('inv-1', { ksefReference: 'REF-001-20260301-AAA', grossAmount: 100000, sellerNIP: '5213456784' }),
      inv('inv-2', { grossAmount: 200000, sellerNIP: '7740001454' }),
      inv('inv-3', { invoiceNumber: 'FV/SPECIAL/003', grossAmount: 300000, sellerNIP: '1234563218' }),
      inv('inv-unmatched', { grossAmount: 999999, sellerNIP: '5213456784' }),
    ]
    const transactions = [
      tx('tx-1', { amount: -100000, description: 'Payment KSeF REF-001-20260301-AAA' }),
      tx('tx-2', { amount: -200000, recipientNIP: '7740001454' }),
      tx('tx-3', { amount: -300000, description: 'FV/SPECIAL/003 payment' }),
      tx('tx-unmatched', { amount: -50000, description: 'Salary payment' }),
    ]

    const report = await runPipeline(invoices, transactions, defaultPasses)

    expect(report.matched).toHaveLength(3)
    expect(report.unmatchedInvoices).toHaveLength(1)
    expect(report.unmatchedInvoices[0]!.id).toBe('inv-unmatched')
    expect(report.unmatchedTransactions).toHaveLength(1)
    expect(report.unmatchedTransactions[0]!.id).toBe('tx-unmatched')

    expect(report.summary.totalInvoices).toBe(4)
    expect(report.summary.totalTransactions).toBe(4)
    expect(report.summary.matchedCount).toBe(3)
    expect(report.summary.averageConfidence).toBeGreaterThan(0)

    // Verify passes matched correctly
    const passNames = report.matched.map((m) => m.passName)
    expect(passNames).toContain('ksef-ref')
  })

  it('does not re-match across passes', async () => {
    const invoices = [
      inv('inv-1', {
        ksefReference: 'REF-20260301-X',
        invoiceNumber: 'FV/2026/03/001',
        sellerNIP: '5213456784',
      }),
    ]
    const transactions = [
      tx('tx-1', {
        amount: -123000,
        recipientNIP: '5213456784',
        description: 'FV/2026/03/001 KSeF:REF-20260301-X',
      }),
    ]

    const report = await runPipeline(invoices, transactions, defaultPasses)
    // Should only match once (by ksef-ref, first pass)
    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('ksef-ref')
  })

  it('reports timing and generates valid report structure', async () => {
    const report = await runPipeline(
      [inv('inv-1')],
      [tx('tx-1', { amount: -123000, recipientNIP: '5213456784' })],
      defaultPasses,
    )

    expect(report.id).toBeDefined()
    expect(report.runAt).toBeDefined()
    expect(report.durationMs).toBeGreaterThanOrEqual(0)
    expect(typeof report.summary.averageConfidence).toBe('number')
  })
})
