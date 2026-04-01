import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'
import { clampConfidence } from '../scoring.js'

export const proximityPass: ReconciliationPass = {
  name: 'proximity',
  order: 500,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    const usedTxIds = new Set<string>()

    for (const invoice of context.invoices) {
      const target = invoice.grossAmount
      const minAmount = Math.floor(target * 0.95)
      const maxAmount = Math.ceil(target * 1.05)
      const referenceDate = invoice.dueDate ?? invoice.issueDate

      let bestMatch: { txId: string; confidence: number; reasons: string[] } | null = null

      for (const tx of context.transactions) {
        if (usedTxIds.has(tx.id)) continue

        const absAmount = Math.abs(tx.amount)
        if (absAmount < minAmount || absAmount > maxAmount) continue

        const daysDiff = Math.abs(
          (new Date(tx.date).getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysDiff > 30) continue

        const proximityFactor = 1 - daysDiff / 30
        const confidence = clampConfidence(50 + 20 * proximityFactor)

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            txId: tx.id,
            confidence,
            reasons: [
              `Amount within 5%: invoice ${target}, transaction ${absAmount}`,
              `Date proximity: ${Math.round(daysDiff)} days apart`,
            ],
          }
        }
      }

      if (bestMatch) {
        results.push({
          invoiceId: invoice.id,
          transactionId: bestMatch.txId,
          confidence: bestMatch.confidence,
          reasons: bestMatch.reasons,
        })
        usedTxIds.add(bestMatch.txId)
      }
    }

    return results
  },
}
