import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'
import { ratio } from 'fuzzball'

const FUZZY_THRESHOLD = 80

export const fuzzyPass: ReconciliationPass = {
  name: 'fuzzy',
  order: 400,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    const usedTxIds = new Set<string>()

    for (const invoice of context.invoices) {
      if (!invoice.sellerName) continue

      for (const tx of context.transactions) {
        if (usedTxIds.has(tx.id)) continue

        // Amount must match exactly
        if (Math.abs(tx.amount) !== invoice.grossAmount) continue

        const txName = tx.senderName ?? tx.recipientName
        if (!txName) continue

        const score = ratio(invoice.sellerName, txName)
        if (score >= FUZZY_THRESHOLD) {
          results.push({
            invoiceId: invoice.id,
            transactionId: tx.id,
            confidence: 80,
            reasons: [
              `Fuzzy name match: "${invoice.sellerName}" ~ "${txName}" (score: ${score})`,
              `Exact amount match: ${Math.abs(tx.amount)} grosze`,
            ],
          })
          usedTxIds.add(tx.id)
          break
        }
      }
    }

    return results
  },
}
