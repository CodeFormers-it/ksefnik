import { z } from 'zod'

export const MatchSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  transactionId: z.string().uuid(),
  transactionIds: z.array(z.string().uuid()).optional(),
  confidence: z.number().int().min(0).max(100),
  passName: z.string(),
  reasons: z.array(z.string()),
  confirmed: z.boolean().default(false),
  createdAt: z.string().datetime(),
})

export type Match = z.infer<typeof MatchSchema>
