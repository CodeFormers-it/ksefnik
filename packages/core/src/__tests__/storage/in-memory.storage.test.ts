import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStorage } from '../../storage/in-memory.storage.js'
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

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage

  beforeEach(() => {
    storage = new InMemoryStorage()
  })

  describe('invoices', () => {
    it('saves and retrieves invoices', async () => {
      const inv = makeInvoice()
      await storage.saveInvoices([inv])
      const result = await storage.getInvoices()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(inv)
    })

    it('overwrites invoice with same id', async () => {
      const id = crypto.randomUUID()
      await storage.saveInvoices([makeInvoice({ id, grossAmount: 100 })])
      await storage.saveInvoices([makeInvoice({ id, grossAmount: 200 })])
      const result = await storage.getInvoices()
      expect(result).toHaveLength(1)
      expect(result[0]!.grossAmount).toBe(200)
    })

    it('filters by NIP (seller)', async () => {
      await storage.saveInvoices([
        makeInvoice({ sellerNIP: '5213456784' }),
        makeInvoice({ sellerNIP: '7740001454' }),
      ])
      const result = await storage.getInvoices({ nip: '5213456784' })
      expect(result).toHaveLength(1)
    })

    it('filters by NIP (buyer)', async () => {
      await storage.saveInvoices([
        makeInvoice({ buyerNIP: '1234563218' }),
        makeInvoice({ buyerNIP: '7740001454' }),
      ])
      const result = await storage.getInvoices({ nip: '1234563218' })
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
      expect(result[0]!.issueDate).toBe('2026-03-10')
    })

    it('filters by invoiceNumber', async () => {
      await storage.saveInvoices([
        makeInvoice({ invoiceNumber: 'FV/2026/03/001' }),
        makeInvoice({ invoiceNumber: 'FV/2026/03/002' }),
      ])
      const result = await storage.getInvoices({ invoiceNumber: 'FV/2026/03/002' })
      expect(result).toHaveLength(1)
    })

    it('returns empty array when no match', async () => {
      const result = await storage.getInvoices({ nip: '0000000000' })
      expect(result).toEqual([])
    })
  })

  describe('transactions', () => {
    it('saves and retrieves transactions', async () => {
      const tx = makeTransaction()
      await storage.saveTransactions([tx])
      const result = await storage.getTransactions()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(tx)
    })

    it('filters by date range', async () => {
      await storage.saveTransactions([
        makeTransaction({ date: '2026-03-01' }),
        makeTransaction({ date: '2026-03-10' }),
      ])
      const result = await storage.getTransactions({ from: '2026-03-05' })
      expect(result).toHaveLength(1)
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
      const result = await storage.getReport('non-existent-id')
      expect(result).toBeNull()
    })
  })
})
