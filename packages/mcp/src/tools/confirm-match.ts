import { z } from 'zod'

export const confirmMatchSchema = z.object({
  matchId: z.string(),
  confirmed: z.boolean(),
})

export type ConfirmMatchInput = z.infer<typeof confirmMatchSchema>

export function confirmMatch(input: ConfirmMatchInput) {
  // In the free tier, confirmation is a no-op acknowledgment
  // Pro tier will persist confirmation state
  return { matchId: input.matchId, confirmed: input.confirmed, success: true }
}
