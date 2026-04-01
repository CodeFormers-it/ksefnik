import { z } from 'zod'
import { MatchSchema } from './match.schema.js'
import { InvoiceSchema } from './invoice.schema.js'
import { BankTransactionSchema } from './bank-transaction.schema.js'

const SummarySchema = z.object({
  totalInvoices: z.number().int().nonnegative(),
  totalTransactions: z.number().int().nonnegative(),
  matchedCount: z.number().int().nonnegative(),
  unmatchedInvoiceCount: z.number().int().nonnegative(),
  unmatchedTransactionCount: z.number().int().nonnegative(),
  averageConfidence: z.number().min(0).max(100),
  passBreakdown: z.record(z.string(), z.number().int().nonnegative()),
})

export const ReconciliationReportSchema = z.object({
  id: z.string().uuid(),
  matched: z.array(MatchSchema),
  unmatchedInvoices: z.array(InvoiceSchema),
  unmatchedTransactions: z.array(BankTransactionSchema),
  summary: SummarySchema,
  runAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative(),
})

export type ReconciliationReport = z.infer<typeof ReconciliationReportSchema>
export type Summary = z.infer<typeof SummarySchema>
