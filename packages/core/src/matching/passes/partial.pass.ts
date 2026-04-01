import type { ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'

export const partialPass: ReconciliationPass = {
  name: 'partial',
  order: 450,

  async run(context: MatchingContext): Promise<MatchResult[]> {
    const results: MatchResult[] = []

    // Group transactions by NIP
    const txByNip = new Map<string, typeof context.transactions>()
    for (const tx of context.transactions) {
      const nip = tx.senderNIP ?? tx.recipientNIP
      if (!nip) continue
      const group = txByNip.get(nip) ?? []
      group.push(tx)
      txByNip.set(nip, group)
    }

    for (const invoice of context.invoices) {
      const txs = txByNip.get(invoice.sellerNIP)
      if (!txs || txs.length < 2) continue

      // Greedy: sort by amount descending, try to sum up to grossAmount
      const sorted = [...txs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      const selected: string[] = []
      let remaining = invoice.grossAmount

      for (const tx of sorted) {
        const absAmount = Math.abs(tx.amount)
        if (absAmount <= remaining) {
          selected.push(tx.id)
          remaining -= absAmount
        }
        if (remaining === 0) break
      }

      if (selected.length < 2) continue

      const ratio = (invoice.grossAmount - remaining) / invoice.grossAmount
      if (ratio < 0.95) continue

      const isExact = remaining === 0
      const confidence = isExact ? 70 : 50

      results.push({
        invoiceId: invoice.id,
        transactionId: selected[0]!,
        transactionIds: selected,
        confidence,
        reasons: [
          `Partial match: ${selected.length} transactions from NIP ${invoice.sellerNIP}`,
          `Sum covers ${Math.round(ratio * 100)}% of invoice amount`,
          isExact ? 'Exact sum match' : 'Approximate sum match',
        ],
      })
    }

    return results
  },
}
