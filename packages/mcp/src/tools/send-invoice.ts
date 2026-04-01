import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const sendInvoiceSchema = z.object({
  xml: z.string(),
  nip: z.string(),
})

export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>

export async function sendInvoiceTool(ksef: Ksefnik, input: SendInvoiceInput) {
  const result = await ksef.invoices.send(input)
  return result
}
