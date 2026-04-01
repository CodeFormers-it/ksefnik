import type {
  Invoice,
  BankTransaction,
  Match,
  ReconciliationReport,
  ReconciliationPass,
  MatchResult,
  MatchingContext,
} from '@ksefnik/shared'
import { getUnmatchedInvoices, getUnmatchedTransactions } from './context.js'

export async function runPipeline(
  invoices: Invoice[],
  transactions: BankTransaction[],
  passes: ReconciliationPass[],
): Promise<ReconciliationReport> {
  const startTime = Date.now()
  const sortedPasses = [...passes].sort((a, b) => a.order - b.order)

  const allMatches: Match[] = []
  const passBreakdown: Record<string, number> = {}

  for (const pass of sortedPasses) {
    const unmatchedInvoices = getUnmatchedInvoices(invoices, allMatches)
    const unmatchedTransactions = getUnmatchedTransactions(transactions, allMatches)

    if (unmatchedInvoices.length === 0 || unmatchedTransactions.length === 0) break

    const context: MatchingContext = {
      invoices: unmatchedInvoices,
      transactions: unmatchedTransactions,
      alreadyMatched: allMatches,
    }

    const results = await pass.run(context)
    const newMatches = resultsToMatches(results, pass.name)

    // Deduplicate: don't match already-matched invoices or transactions
    const matchedInvoiceIds = new Set(allMatches.map((m) => m.invoiceId))
    const matchedTxIds = new Set<string>()
    for (const m of allMatches) {
      matchedTxIds.add(m.transactionId)
      if (m.transactionIds) m.transactionIds.forEach((id) => matchedTxIds.add(id))
    }

    for (const match of newMatches) {
      if (matchedInvoiceIds.has(match.invoiceId)) continue
      if (matchedTxIds.has(match.transactionId)) continue

      allMatches.push(match)
      matchedInvoiceIds.add(match.invoiceId)
      matchedTxIds.add(match.transactionId)
      if (match.transactionIds) match.transactionIds.forEach((id) => matchedTxIds.add(id))

      passBreakdown[pass.name] = (passBreakdown[pass.name] ?? 0) + 1
    }
  }

  const unmatchedInvoices = getUnmatchedInvoices(invoices, allMatches)
  const unmatchedTxs = getUnmatchedTransactions(transactions, allMatches)

  const avgConfidence =
    allMatches.length > 0
      ? allMatches.reduce((sum, m) => sum + m.confidence, 0) / allMatches.length
      : 0

  return {
    id: crypto.randomUUID(),
    matched: allMatches,
    unmatchedInvoices,
    unmatchedTransactions: unmatchedTxs,
    summary: {
      totalInvoices: invoices.length,
      totalTransactions: transactions.length,
      matchedCount: allMatches.length,
      unmatchedInvoiceCount: unmatchedInvoices.length,
      unmatchedTransactionCount: unmatchedTxs.length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      passBreakdown,
    },
    runAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

function resultsToMatches(results: MatchResult[], passName: string): Match[] {
  return results.map((r) => ({
    id: crypto.randomUUID(),
    invoiceId: r.invoiceId,
    transactionId: r.transactionId,
    transactionIds: r.transactionIds,
    confidence: r.confidence,
    passName,
    reasons: r.reasons,
    confirmed: false,
    createdAt: new Date().toISOString(),
  }))
}
