import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const syncInvoicesSchema = z.object({
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
  nip: z.string().optional(),
})

export type SyncInvoicesInput = z.infer<typeof syncInvoicesSchema>

export async function syncInvoices(ksef: Ksefnik, input: SyncInvoicesInput) {
  const invoices = await ksef.invoices.fetch({
    from: input.dateFrom,
    to: input.dateTo,
    nip: input.nip,
  })
  return { invoices, count: invoices.length }
}
