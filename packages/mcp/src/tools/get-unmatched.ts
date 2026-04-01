import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const getUnmatchedSchema = z.object({
  reportId: z.string(),
})

export type GetUnmatchedInput = z.infer<typeof getUnmatchedSchema>

export async function getUnmatched(ksef: Ksefnik, input: GetUnmatchedInput) {
  const report = await ksef.storage.getReport(input.reportId)
  if (!report) return { error: 'Report not found' }
  return {
    unmatchedInvoices: report.unmatchedInvoices,
    unmatchedTransactions: report.unmatchedTransactions,
  }
}
