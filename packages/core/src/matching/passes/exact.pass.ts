import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'
import { extractFirstNIP } from '../../bank/nip-extractor.js'

export const exactPass: ReconciliationPass = {
  name: 'exact',
  order: 200,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    const usedTxIds = new Set<string>()

    for (const invoice of context.invoices) {
      for (const tx of context.transactions) {
        if (usedTxIds.has(tx.id)) continue

        const txAmount = Math.abs(tx.amount)
        if (txAmount !== invoice.grossAmount) continue

        const nip = tx.senderNIP ?? tx.recipientNIP ?? extractFirstNIP(tx.description)
        if (!nip || nip !== invoice.sellerNIP) continue

        results.push({
          invoiceId: invoice.id,
          transactionId: tx.id,
          confidence: 95,
          reasons: [
            `Exact amount match: ${txAmount} grosze`,
            `NIP match: ${nip}`,
          ],
        })
        usedTxIds.add(tx.id)
        break
      }
    }

    return results
  },
}
