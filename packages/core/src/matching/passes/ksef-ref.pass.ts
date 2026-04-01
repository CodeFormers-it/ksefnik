import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'

export const ksefRefPass: ReconciliationPass = {
  name: 'ksef-ref',
  order: 100,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []

    for (const invoice of context.invoices) {
      if (!invoice.ksefReference) continue

      const ref = invoice.ksefReference.toLowerCase()

      for (const tx of context.transactions) {
        if (tx.description.toLowerCase().includes(ref)) {
          results.push({
            invoiceId: invoice.id,
            transactionId: tx.id,
            confidence: 99,
            reasons: [`KSeF reference "${invoice.ksefReference}" found in transaction description`],
          })
          break
        }
      }
    }

    return results
  },
}
