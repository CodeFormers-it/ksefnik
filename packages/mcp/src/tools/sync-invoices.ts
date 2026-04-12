import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const syncInvoicesSchema = z.object({
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
  nip: z.string().optional(),
  /**
   * `sales` = invoices issued by this company (Subject1 on KSeF side),
   * `cost`  = invoices received by this company (Subject2).
   * Defaults to `cost` for backwards compatibility with the MVP.
   */
  subject: z.enum(['sales', 'cost']).optional(),
})

export type SyncInvoicesInput = z.infer<typeof syncInvoicesSchema>

export async function syncInvoices(ksef: Ksefnik, input: SyncInvoicesInput) {
  const subjectType = input.subject === 'sales' ? 'Subject1' : 'Subject2'
  const invoices = await ksef.invoices.fetch({
    from: input.dateFrom,
    to: input.dateTo,
    nip: input.nip,
    subjectType,
  })
  return { invoices, count: invoices.length, subject: input.subject ?? 'cost' }
}
