import { describe, it, expect } from 'vitest'
import type { Invoice, BankTransaction, ReconciliationPass, MatchResult, MatchingContext } from '@ksefnik/shared'
import { runPipeline } from '../../matching/pipeline.js'
import { clampConfidence, dateProximityBonus, amountMatchBonus, agePenalty } from '../../matching/scoring.js'

function makeInvoice(id: string, overrides: Partial<Invoice> = {}): Invoice {
  return {
    id,
    invoiceNumber: `FV/${id}`,
    sellerNIP: '5213456784',
    grossAmount: 123000,
    currency: 'PLN',
    issueDate: '2026-03-01',
    createdAt: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

function makeTx(id: string, overrides: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id,
    date: '2026-03-01',
    amount: -123000,
    description: 'FV payment',
    bank: 'mbank',
    raw: 'raw',
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

function createSimplePass(name: string, order: number, matchFn: (ctx: MatchingContext) => MatchResult[]): ReconciliationPass {
  return {
    name,
    order,
    async run(ctx) { return matchFn(ctx) },
  }
}

describe('runPipeline', () => {
  it('runs passes in order and builds report', async () => {
    const inv = makeInvoice('inv-1')
    const tx = makeTx('tx-1')

    const pass = createSimplePass('test-pass', 100, (ctx) => [{
      invoiceId: ctx.invoices[0]!.id,
      transactionId: ctx.transactions[0]!.id,
      confidence: 95,
      reasons: ['test match'],
    }])

    const report = await runPipeline([inv], [tx], [pass])

    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('test-pass')
    expect(report.matched[0]!.confidence).toBe(95)
    expect(report.unmatchedInvoices).toHaveLength(0)
    expect(report.unmatchedTransactions).toHaveLength(0)
    expect(report.summary.matchedCount).toBe(1)
    expect(report.summary.passBreakdown['test-pass']).toBe(1)
  })

  it('does not re-match already matched invoices', async () => {
    const inv = makeInvoice('inv-1')
    const tx1 = makeTx('tx-1')
    const tx2 = makeTx('tx-2')

    const pass1 = createSimplePass('pass1', 100, (ctx) => [{
      invoiceId: ctx.invoices[0]!.id,
      transactionId: ctx.transactions[0]!.id,
      confidence: 95,
      reasons: ['first'],
    }])

    const pass2 = createSimplePass('pass2', 200, (ctx) =>
      ctx.invoices.map((i) => ({
        invoiceId: i.id,
        transactionId: ctx.transactions[0]!.id,
        confidence: 80,
        reasons: ['second'],
      })),
    )

    const report = await runPipeline([inv], [tx1, tx2], [pass1, pass2])

    expect(report.matched).toHaveLength(1)
    expect(report.matched[0]!.passName).toBe('pass1')
  })

  it('handles empty inputs', async () => {
    const report = await runPipeline([], [], [])
    expect(report.matched).toHaveLength(0)
    expect(report.summary.matchedCount).toBe(0)
  })

  it('tracks unmatched correctly', async () => {
    const inv1 = makeInvoice('inv-1')
    const inv2 = makeInvoice('inv-2')
    const tx = makeTx('tx-1')

    const pass = createSimplePass('test', 100, (ctx) => [{
      invoiceId: ctx.invoices[0]!.id,
      transactionId: ctx.transactions[0]!.id,
      confidence: 90,
      reasons: ['match'],
    }])

    const report = await runPipeline([inv1, inv2], [tx], [pass])

    expect(report.matched).toHaveLength(1)
    expect(report.unmatchedInvoices).toHaveLength(1)
    expect(report.unmatchedInvoices[0]!.id).toBe('inv-2')
    expect(report.summary.unmatchedInvoiceCount).toBe(1)
  })

  it('sorts passes by order', async () => {
    const inv = makeInvoice('inv-1')
    const tx = makeTx('tx-1')
    const order: string[] = []

    const pass1 = createSimplePass('second', 200, () => {
      order.push('second')
      return []
    })
    const pass2 = createSimplePass('first', 100, (ctx) => {
      order.push('first')
      return [{
        invoiceId: ctx.invoices[0]!.id,
        transactionId: ctx.transactions[0]!.id,
        confidence: 99,
        reasons: ['first wins'],
      }]
    })

    await runPipeline([inv], [tx], [pass1, pass2])
    expect(order[0]).toBe('first')
  })
})

describe('scoring helpers', () => {
  it('clamps confidence to 0-100', () => {
    expect(clampConfidence(150)).toBe(100)
    expect(clampConfidence(-10)).toBe(0)
    expect(clampConfidence(85.7)).toBe(86)
  })

  it('calculates date proximity bonus', () => {
    expect(dateProximityBonus('2026-03-01', '2026-03-02')).toBe(10)
    expect(dateProximityBonus('2026-03-01', '2026-03-06')).toBe(5)
    expect(dateProximityBonus('2026-03-01', '2026-03-20')).toBe(0)
    expect(dateProximityBonus('2026-03-01', '2026-06-01')).toBe(-10)
  })

  it('calculates amount match bonus', () => {
    expect(amountMatchBonus(123000, -123000)).toBe(5)
    expect(amountMatchBonus(123000, -120000)).toBe(0)
  })

  it('calculates age penalty', () => {
    const now = new Date('2026-03-15')
    expect(agePenalty('2026-03-01', now)).toBe(0)
    expect(agePenalty('2025-12-01', now)).toBe(-10)
  })
})
