import type { Ksefnik } from '@ksefnik/core'
import type { Invoice } from '@ksefnik/shared'
import { z } from 'zod'

export const validateInvoiceSchema = z.object({
  invoice: z.record(z.unknown()),
})

export type ValidateInvoiceInput = z.infer<typeof validateInvoiceSchema>

export function validateInvoiceTool(ksef: Ksefnik, input: ValidateInvoiceInput) {
  const reports = ksef.validation.validate([input.invoice as Invoice])
  const report = reports[0]!
  return {
    valid: report.valid,
    errors: report.results.filter((r) => !r.valid),
  }
}
