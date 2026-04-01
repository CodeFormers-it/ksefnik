import { z } from 'zod'

export const BankTransactionSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  amount: z.number().int(),
  description: z.string(),
  senderName: z.string().optional(),
  senderNIP: z.string().regex(/^\d{10}$/).optional(),
  recipientName: z.string().optional(),
  recipientNIP: z.string().regex(/^\d{10}$/).optional(),
  bank: z.enum(['mt940', 'mbank', 'ing', 'pko', 'santander', 'other']),
  raw: z.string(),
  createdAt: z.string().datetime(),
})

export type BankTransaction = z.infer<typeof BankTransactionSchema>
