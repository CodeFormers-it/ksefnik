import type { Invoice, BankTransaction, ReconciliationReport } from '../schemas/index.js'

export interface InvoiceQuery {
  nip?: string
  from?: string
  to?: string
  invoiceNumber?: string
}

export interface TransactionQuery {
  from?: string
  to?: string
  bank?: string
  minAmount?: number
  maxAmount?: number
}

export interface Storage {
  saveInvoices(invoices: Invoice[]): Promise<void>
  getInvoices(query?: InvoiceQuery): Promise<Invoice[]>
  saveTransactions(txs: BankTransaction[]): Promise<void>
  getTransactions(query?: TransactionQuery): Promise<BankTransaction[]>
  saveReport(report: ReconciliationReport): Promise<void>
  getReport(id: string): Promise<ReconciliationReport | null>
}
