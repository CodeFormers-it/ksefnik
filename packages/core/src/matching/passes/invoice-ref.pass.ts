import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'

export const invoiceRefPass: ReconciliationPass = {
  name: 'invoice-ref',
  order: 300,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    const usedTxIds = new Set<string>()

    for (const invoice of context.invoices) {
      const ref = invoice.invoiceNumber.toLowerCase()

      for (const tx of context.transactions) {
        if (usedTxIds.has(tx.id)) continue

        if (tx.description.toLowerCase().includes(ref)) {
          const amountMatches = Math.abs(tx.amount) === invoice.grossAmount
          const confidence = amountMatches ? 90 : 75
          const reasons = [`Invoice number "${invoice.invoiceNumber}" found in transaction description`]
          if (amountMatches) reasons.push('Amount also matches')

          results.push({
            invoiceId: invoice.id,
            transactionId: tx.id,
            confidence,
            reasons,
          })
          usedTxIds.add(tx.id)
          break
        }
      }
    }

    return results
  },
}
