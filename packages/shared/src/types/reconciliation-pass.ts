import type { Invoice, BankTransaction, Match } from '../schemas/index.js'

export interface MatchingContext {
  invoices: Invoice[]
  transactions: BankTransaction[]
  alreadyMatched: Match[]
}

export interface MatchResult {
  invoiceId: string
  transactionId: string
  transactionIds?: string[]
  confidence: number
  reasons: string[]
}

export interface ReconciliationPass {
  name: string
  order: number
  run(context: MatchingContext): Promise<MatchResult[]>
}
