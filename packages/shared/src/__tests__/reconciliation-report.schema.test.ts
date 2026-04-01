import { describe, it, expect } from 'vitest'
import { ReconciliationReportSchema } from '../schemas/index.js'

const validReport = {
  id: '550e8400-e29b-41d4-a716-446655440020',
  matched: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      transactionId: '550e8400-e29b-41d4-a716-446655440001',
      confidence: 95,
      passName: 'exact-nip',
      reasons: ['NIP match'],
      confirmed: false,
      createdAt: '2026-03-15T14:00:00Z',
    },
  ],
  unmatchedInvoices: [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'FV/2026/03/099',
      sellerNIP: '7740001454',
      grossAmount: 2250000,
      currency: 'PLN',
      issueDate: '2026-03-15',
      createdAt: '2026-03-15T10:00:00Z',
    },
  ],
  unmatchedTransactions: [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      date: '2026-03-05',
      amount: -89050,
      description: 'Zaliczka marzec',
      bank: 'mbank',
      raw: 'raw line',
      createdAt: '2026-03-05T12:00:00Z',
    },
  ],
  summary: {
    totalInvoices: 3,
    totalTransactions: 5,
    matchedCount: 1,
    unmatchedInvoiceCount: 1,
    unmatchedTransactionCount: 1,
    averageConfidence: 95,
    passBreakdown: { 'exact-nip': 1 },
  },
  runAt: '2026-03-15T15:00:00Z',
  durationMs: 234,
}

describe('ReconciliationReportSchema', () => {
  it('accepts a valid report', () => {
    const result = ReconciliationReportSchema.safeParse(validReport)
    expect(result.success).toBe(true)
  })

  it('accepts report with empty arrays', () => {
    const result = ReconciliationReportSchema.safeParse({
      ...validReport,
      matched: [],
      unmatchedInvoices: [],
      unmatchedTransactions: [],
      summary: {
        ...validReport.summary,
        matchedCount: 0,
        unmatchedInvoiceCount: 0,
        unmatchedTransactionCount: 0,
        averageConfidence: 0,
        passBreakdown: {},
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing summary', () => {
    const { summary: _, ...withoutSummary } = validReport
    const result = ReconciliationReportSchema.safeParse(withoutSummary)
    expect(result.success).toBe(false)
  })

  it('rejects negative durationMs', () => {
    const result = ReconciliationReportSchema.safeParse({
      ...validReport,
      durationMs: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects averageConfidence above 100', () => {
    const result = ReconciliationReportSchema.safeParse({
      ...validReport,
      summary: { ...validReport.summary, averageConfidence: 150 },
    })
    expect(result.success).toBe(false)
  })

  it('validates nested match schemas within report', () => {
    const result = ReconciliationReportSchema.safeParse({
      ...validReport,
      matched: [{ ...validReport.matched[0], confidence: 200 }],
    })
    expect(result.success).toBe(false)
  })
})
