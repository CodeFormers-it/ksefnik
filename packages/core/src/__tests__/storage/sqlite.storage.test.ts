import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SqliteStorage } from '../../storage/sqlite.storage.js'
import type { Invoice, BankTransaction, ReconciliationReport } from '@ksefnik/shared'

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: crypto.randomUUID(),
    invoiceNumber: 'FV/2026/03/001',
    sellerNIP: '5213456784',
    grossAmount: 123000,
    currency: 'PLN',
    issueDate: '2026-03-01',
    createdAt: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id: crypto.randomUUID(),
    date: '2026-03-01',
    amount: -123000,
    description: 'FV/2026/03/001',
    bank: 'mbank',
    raw: 'raw line',
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

function makeReport(overrides: Partial<ReconciliationReport> = {}): ReconciliationReport {
  return {
    id: crypto.randomUUID(),
    matched: [],
    unmatchedInvoices: [],
    unmatchedTransactions: [],
    summary: {
      totalInvoices: 0,
      totalTransactions: 0,
      matchedCount: 0,
      unmatchedInvoiceCount: 0,
      unmatchedTransactionCount: 0,
      averageConfidence: 0,
      passBreakdown: {},
    },
    runAt: '2026-03-15T15:00:00Z',
    durationMs: 100,
    ...overrides,
  }
}

describe('SqliteStorage', () => {
  let storage: SqliteStorage

  beforeEach(() => {
    storage = new SqliteStorage(':memory:')
  })

  afterEach(() => {
    storage.close()
  })

  describe('invoices', () => {
    it('saves and retrieves invoices', async () => {
      const inv = makeInvoice()
      await storage.saveInvoices([inv])
      const result = await storage.getInvoices()
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(inv.id)
      expect(result[0]!.grossAmount).toBe(inv.grossAmount)
    })

    it('persists data between operations', async () => {
      const inv = makeInvoice()
      await storage.saveInvoices([inv])
      // second call should still find it
      const result = await storage.getInvoices()
      expect(result).toHaveLength(1)
    })

    it('overwrites invoice with same id', async () => {
      const id = crypto.randomUUID()
      await storage.saveInvoices([makeInvoice({ id, grossAmount: 100 })])
      await storage.saveInvoices([makeInvoice({ id, grossAmount: 200 })])
      const result = await storage.getInvoices()
      expect(result).toHaveLength(1)
      expect(result[0]!.grossAmount).toBe(200)
    })

    it('filters by NIP', async () => {
      await storage.saveInvoices([
        makeInvoice({ sellerNIP: '5213456784' }),
        makeInvoice({ sellerNIP: '7740001454' }),
      ])
      const result = await storage.getInvoices({ nip: '5213456784' })
      expect(result).toHaveLength(1)
    })

    it('filters by date range', async () => {
      await storage.saveInvoices([
        makeInvoice({ issueDate: '2026-03-01' }),
        makeInvoice({ issueDate: '2026-03-10' }),
        makeInvoice({ issueDate: '2026-03-20' }),
      ])
      const result = await storage.getInvoices({ from: '2026-03-05', to: '2026-03-15' })
      expect(result).toHaveLength(1)
    })

    it('filters by invoiceNumber', async () => {
      await storage.saveInvoices([
        makeInvoice({ invoiceNumber: 'FV/2026/03/001' }),
        makeInvoice({ invoiceNumber: 'FV/2026/03/002' }),
      ])
      const result = await storage.getInvoices({ invoiceNumber: 'FV/2026/03/002' })
      expect(result).toHaveLength(1)
    })

    it('preserves lineItems as JSON', async () => {
      const inv = makeInvoice({
        lineItems: [
          { lineNumber: 1, description: 'Test', netAmount: 50000 },
        ],
      })
      await storage.saveInvoices([inv])
      const result = await storage.getInvoices()
      expect(result[0]!.lineItems).toEqual(inv.lineItems)
    })

    it('handles optional fields correctly', async () => {
      const inv = makeInvoice() // no optional fields
      await storage.saveInvoices([inv])
      const result = await storage.getInvoices()
      expect(result[0]!.buyerNIP).toBeUndefined()
      expect(result[0]!.lineItems).toBeUndefined()
    })
  })

  describe('transactions', () => {
    it('saves and retrieves transactions', async () => {
      const tx = makeTransaction()
      await storage.saveTransactions([tx])
      const result = await storage.getTransactions()
      expect(result).toHaveLength(1)
      expect(result[0]!.amount).toBe(tx.amount)
    })

    it('filters by bank', async () => {
      await storage.saveTransactions([
        makeTransaction({ bank: 'mbank' }),
        makeTransaction({ bank: 'ing' }),
      ])
      const result = await storage.getTransactions({ bank: 'mbank' })
      expect(result).toHaveLength(1)
    })

    it('filters by amount range', async () => {
      await storage.saveTransactions([
        makeTransaction({ amount: -50000 }),
        makeTransaction({ amount: -200000 }),
        makeTransaction({ amount: 150000 }),
      ])
      const result = await storage.getTransactions({ minAmount: -100000, maxAmount: 200000 })
      expect(result).toHaveLength(2)
    })
  })

  describe('reports', () => {
    it('saves and retrieves a report', async () => {
      const report = makeReport()
      await storage.saveReport(report)
      const result = await storage.getReport(report.id)
      expect(result).toEqual(report)
    })

    it('returns null for non-existent report', async () => {
      const result = await storage.getReport('non-existent')
      expect(result).toBeNull()
    })
  })
})
