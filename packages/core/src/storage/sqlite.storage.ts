import Database from 'better-sqlite3'
import type {
  Storage,
  InvoiceQuery,
  TransactionQuery,
  Invoice,
  BankTransaction,
  ReconciliationReport,
} from '@ksefnik/shared'

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  seller_nip TEXT NOT NULL,
  buyer_nip TEXT,
  gross_amount INTEGER NOT NULL,
  net_amount INTEGER,
  vat_amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'PLN',
  issue_date TEXT NOT NULL,
  sales_date TEXT,
  due_date TEXT,
  ksef_reference TEXT,
  seller_name TEXT,
  buyer_name TEXT,
  description TEXT,
  line_items TEXT,
  raw_xml TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  sender_name TEXT,
  sender_nip TEXT,
  recipient_name TEXT,
  recipient_nip TEXT,
  bank TEXT NOT NULL,
  raw TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reconciliation_reports (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);
`

function invoiceToRow(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    seller_nip: inv.sellerNIP,
    buyer_nip: inv.buyerNIP ?? null,
    gross_amount: inv.grossAmount,
    net_amount: inv.netAmount ?? null,
    vat_amount: inv.vatAmount ?? null,
    currency: inv.currency,
    issue_date: inv.issueDate,
    sales_date: inv.salesDate ?? null,
    due_date: inv.dueDate ?? null,
    ksef_reference: inv.ksefReference ?? null,
    seller_name: inv.sellerName ?? null,
    buyer_name: inv.buyerName ?? null,
    description: inv.description ?? null,
    line_items: inv.lineItems ? JSON.stringify(inv.lineItems) : null,
    raw_xml: inv.rawXml ?? null,
    created_at: inv.createdAt,
  }
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row['id'] as string,
    invoiceNumber: row['invoice_number'] as string,
    sellerNIP: row['seller_nip'] as string,
    ...(row['buyer_nip'] != null && { buyerNIP: row['buyer_nip'] as string }),
    grossAmount: row['gross_amount'] as number,
    ...(row['net_amount'] != null && { netAmount: row['net_amount'] as number }),
    ...(row['vat_amount'] != null && { vatAmount: row['vat_amount'] as number }),
    currency: 'PLN',
    issueDate: row['issue_date'] as string,
    ...(row['sales_date'] != null && { salesDate: row['sales_date'] as string }),
    ...(row['due_date'] != null && { dueDate: row['due_date'] as string }),
    ...(row['ksef_reference'] != null && { ksefReference: row['ksef_reference'] as string }),
    ...(row['seller_name'] != null && { sellerName: row['seller_name'] as string }),
    ...(row['buyer_name'] != null && { buyerName: row['buyer_name'] as string }),
    ...(row['description'] != null && { description: row['description'] as string }),
    ...(row['line_items'] != null && {
      lineItems: JSON.parse(row['line_items'] as string) as Invoice['lineItems'],
    }),
    ...(row['raw_xml'] != null && { rawXml: row['raw_xml'] as string }),
    createdAt: row['created_at'] as string,
  }
}

function transactionToRow(tx: BankTransaction) {
  return {
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    description: tx.description,
    sender_name: tx.senderName ?? null,
    sender_nip: tx.senderNIP ?? null,
    recipient_name: tx.recipientName ?? null,
    recipient_nip: tx.recipientNIP ?? null,
    bank: tx.bank,
    raw: tx.raw,
    created_at: tx.createdAt,
  }
}

function rowToTransaction(row: Record<string, unknown>): BankTransaction {
  return {
    id: row['id'] as string,
    date: row['date'] as string,
    amount: row['amount'] as number,
    description: row['description'] as string,
    ...(row['sender_name'] != null && { senderName: row['sender_name'] as string }),
    ...(row['sender_nip'] != null && { senderNIP: row['sender_nip'] as string }),
    ...(row['recipient_name'] != null && { recipientName: row['recipient_name'] as string }),
    ...(row['recipient_nip'] != null && { recipientNIP: row['recipient_nip'] as string }),
    bank: row['bank'] as BankTransaction['bank'],
    raw: row['raw'] as string,
    createdAt: row['created_at'] as string,
  }
}

export class SqliteStorage implements Storage {
  private db: Database.Database

  constructor(path: string = ':memory:') {
    this.db = new Database(path)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(MIGRATIONS)
  }

  async saveInvoices(invoices: Invoice[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO invoices
      (id, invoice_number, seller_nip, buyer_nip, gross_amount, net_amount, vat_amount,
       currency, issue_date, sales_date, due_date, ksef_reference, seller_name, buyer_name,
       description, line_items, raw_xml, created_at)
      VALUES
      (@id, @invoice_number, @seller_nip, @buyer_nip, @gross_amount, @net_amount, @vat_amount,
       @currency, @issue_date, @sales_date, @due_date, @ksef_reference, @seller_name, @buyer_name,
       @description, @line_items, @raw_xml, @created_at)
    `)
    const insertMany = this.db.transaction((items: Invoice[]) => {
      for (const inv of items) {
        stmt.run(invoiceToRow(inv))
      }
    })
    insertMany(invoices)
  }

  async getInvoices(query?: InvoiceQuery): Promise<Invoice[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (query?.nip) {
      conditions.push('(seller_nip = @nip OR buyer_nip = @nip)')
      params['nip'] = query.nip
    }
    if (query?.from) {
      conditions.push('issue_date >= @from')
      params['from'] = query.from
    }
    if (query?.to) {
      conditions.push('issue_date <= @to')
      params['to'] = query.to
    }
    if (query?.invoiceNumber) {
      conditions.push('invoice_number = @invoiceNumber')
      params['invoiceNumber'] = query.invoiceNumber
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = this.db.prepare(`SELECT * FROM invoices ${where}`).all(params)
    return rows.map((r) => rowToInvoice(r as Record<string, unknown>))
  }

  async saveTransactions(txs: BankTransaction[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO bank_transactions
      (id, date, amount, description, sender_name, sender_nip, recipient_name, recipient_nip,
       bank, raw, created_at)
      VALUES
      (@id, @date, @amount, @description, @sender_name, @sender_nip, @recipient_name,
       @recipient_nip, @bank, @raw, @created_at)
    `)
    const insertMany = this.db.transaction((items: BankTransaction[]) => {
      for (const tx of items) {
        stmt.run(transactionToRow(tx))
      }
    })
    insertMany(txs)
  }

  async getTransactions(query?: TransactionQuery): Promise<BankTransaction[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (query?.from) {
      conditions.push('date >= @from')
      params['from'] = query.from
    }
    if (query?.to) {
      conditions.push('date <= @to')
      params['to'] = query.to
    }
    if (query?.bank) {
      conditions.push('bank = @bank')
      params['bank'] = query.bank
    }
    if (query?.minAmount !== undefined) {
      conditions.push('amount >= @minAmount')
      params['minAmount'] = query.minAmount
    }
    if (query?.maxAmount !== undefined) {
      conditions.push('amount <= @maxAmount')
      params['maxAmount'] = query.maxAmount
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = this.db.prepare(`SELECT * FROM bank_transactions ${where}`).all(params)
    return rows.map((r) => rowToTransaction(r as Record<string, unknown>))
  }

  async saveReport(report: ReconciliationReport): Promise<void> {
    this.db
      .prepare('INSERT OR REPLACE INTO reconciliation_reports (id, data) VALUES (@id, @data)')
      .run({ id: report.id, data: JSON.stringify(report) })
  }

  async getReport(id: string): Promise<ReconciliationReport | null> {
    const row = this.db
      .prepare('SELECT data FROM reconciliation_reports WHERE id = ?')
      .get(id) as { data: string } | undefined
    return row ? (JSON.parse(row.data) as ReconciliationReport) : null
  }

  close(): void {
    this.db.close()
  }
}
