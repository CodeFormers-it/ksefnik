import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const queryInvoicesSchema = z.object({
  nip: z.string().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  invoiceNumber: z.string().optional(),
})

export type QueryInvoicesInput = z.infer<typeof queryInvoicesSchema>

export async function queryInvoices(ksef: Ksefnik, input: QueryInvoicesInput) {
  const invoices = await ksef.storage.getInvoices(input)
  return { invoices, count: invoices.length }
}
