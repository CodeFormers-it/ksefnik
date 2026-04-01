import type { Invoice } from '@ksefnik/shared'

export class InvoiceStore {
  private invoices = new Map<string, Invoice>()

  seed(invoices: Invoice[]): void {
    for (const inv of invoices) {
      this.invoices.set(inv.id, inv)
    }
  }

  add(invoice: Invoice): void {
    this.invoices.set(invoice.id, invoice)
  }

  getAll(): Invoice[] {
    return [...this.invoices.values()]
  }

  getByDateRange(from: string, to: string): Invoice[] {
    return this.getAll().filter((i) => i.issueDate >= from && i.issueDate <= to)
  }

  clear(): void {
    this.invoices.clear()
  }
}
