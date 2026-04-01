import type {
  Storage,
  InvoiceQuery,
  TransactionQuery,
  Invoice,
  BankTransaction,
  ReconciliationReport,
} from '@ksefnik/shared'

export class InMemoryStorage implements Storage {
  private invoices = new Map<string, Invoice>()
  private transactions = new Map<string, BankTransaction>()
  private reports = new Map<string, ReconciliationReport>()

  async saveInvoices(invoices: Invoice[]): Promise<void> {
    for (const inv of invoices) {
      this.invoices.set(inv.id, inv)
    }
  }

  async getInvoices(query?: InvoiceQuery): Promise<Invoice[]> {
    let results = [...this.invoices.values()]

    if (query?.nip) {
      results = results.filter((i) => i.sellerNIP === query.nip || i.buyerNIP === query.nip)
    }
    if (query?.from) {
      results = results.filter((i) => i.issueDate >= query.from!)
    }
    if (query?.to) {
      results = results.filter((i) => i.issueDate <= query.to!)
    }
    if (query?.invoiceNumber) {
      results = results.filter((i) => i.invoiceNumber === query.invoiceNumber)
    }

    return results
  }

  async saveTransactions(txs: BankTransaction[]): Promise<void> {
    for (const tx of txs) {
      this.transactions.set(tx.id, tx)
    }
  }

  async getTransactions(query?: TransactionQuery): Promise<BankTransaction[]> {
    let results = [...this.transactions.values()]

    if (query?.from) {
      results = results.filter((t) => t.date >= query.from!)
    }
    if (query?.to) {
      results = results.filter((t) => t.date <= query.to!)
    }
    if (query?.bank) {
      results = results.filter((t) => t.bank === query.bank)
    }
    if (query?.minAmount !== undefined) {
      results = results.filter((t) => t.amount >= query.minAmount!)
    }
    if (query?.maxAmount !== undefined) {
      results = results.filter((t) => t.amount <= query.maxAmount!)
    }

    return results
  }

  async saveReport(report: ReconciliationReport): Promise<void> {
    this.reports.set(report.id, report)
  }

  async getReport(id: string): Promise<ReconciliationReport | null> {
    return this.reports.get(id) ?? null
  }
}
