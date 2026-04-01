import type { Ksefnik } from '@ksefnik/core'
import { z } from 'zod'

export const importBankSchema = z.object({
  content: z.string(),
})

export type ImportBankInput = z.infer<typeof importBankSchema>

export async function importBank(ksef: Ksefnik, input: ImportBankInput) {
  const transactions = await ksef.bank.importFromString(input.content)
  return { transactions, count: transactions.length }
}
