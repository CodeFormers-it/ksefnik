import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const getUpoSchema = z.object({
  ksefReferenceNumber: z.string().describe('KSeF reference number of the invoice'),
})

export type GetUpoInput = z.infer<typeof getUpoSchema>

export async function getUpo(ksef: Ksefnik, input: GetUpoInput) {
  const result = await ksef.invoices.getUpo(input.ksefReferenceNumber)
  return result
}
