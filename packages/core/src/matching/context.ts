import type { Invoice, BankTransaction, Match, MatchingContext } from '@ksefnik/shared'

export function createMatchingContext(
  invoices: Invoice[],
  transactions: BankTransaction[],
  alreadyMatched: Match[] = [],
): MatchingContext {
  return { invoices, transactions, alreadyMatched }
}

export function getUnmatchedInvoices(invoices: Invoice[], matched: Match[]): Invoice[] {
  const matchedIds = new Set(matched.map((m) => m.invoiceId))
  return invoices.filter((i) => !matchedIds.has(i.id))
}

export function getUnmatchedTransactions(
  transactions: BankTransaction[],
  matched: Match[],
): BankTransaction[] {
  const matchedIds = new Set<string>()
  for (const m of matched) {
    matchedIds.add(m.transactionId)
    if (m.transactionIds) {
      for (const id of m.transactionIds) matchedIds.add(id)
    }
  }
  return transactions.filter((t) => !matchedIds.has(t.id))
}
