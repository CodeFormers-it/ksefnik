import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createKsefnik } from '@ksefnik/core'
import { createKsefSimulator } from '@ksefnik/simulator'
import type { Invoice } from '@ksefnik/shared'

const fixturesDir = join(import.meta.dirname, '../fixtures')

function makeInvoices(): Invoice[] {
  const now = '2026-03-01T10:00:00Z'
  return [
    // Match by exact NIP + amount (in mBank fixture)
    {
      id: 'inv-001', invoiceNumber: 'FV/2026/03/001', sellerNIP: '5213456784',
      grossAmount: 123000, currency: 'PLN', issueDate: '2026-03-01', createdAt: now,
      sellerName: 'TECHSOLUTIONS SP Z OO',
    },
    // Match by invoice ref in description
    {
      id: 'inv-002', invoiceNumber: 'FV/2026/02/015', sellerNIP: '6781234567',
      grossAmount: 450000, currency: 'PLN', issueDate: '2026-02-15', createdAt: now,
      sellerName: 'DIGITAL MEDIA GROUP SA',
    },
    // Match by amount + NIP (incoming)
    {
      id: 'inv-003', invoiceNumber: 'FV/2026/03/002', sellerNIP: '5261003187',
      grossAmount: 1500000, currency: 'PLN', issueDate: '2026-03-03', createdAt: now,
      sellerName: 'BUDIMEX SA',
    },
    // Match by amount + NIP
    {
      id: 'inv-004', invoiceNumber: 'FV/2026/03/003', sellerNIP: '8971234561',
      grossAmount: 780000, currency: 'PLN', issueDate: '2026-03-10', createdAt: now,
      sellerName: 'CLOUDWARE SP Z OO',
    },
    // Unmatched invoice (no matching transaction)
    {
      id: 'inv-005', invoiceNumber: 'FV/2026/03/999', sellerNIP: '5213456784',
      grossAmount: 9999999, currency: 'PLN', issueDate: '2026-03-20', createdAt: now,
    },
  ]
}

describe('Full reconciliation E2E', () => {
  it('reconciles simulator invoices with bank fixture', async () => {
    const invoices = makeInvoices()
    const { adapter } = createKsefSimulator({ scenario: 'happy-path', invoices })

    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
      adapter,
    })

    // Fetch invoices from simulator
    const fetched = await ksef.invoices.fetch({ from: '2026-01-01', to: '2026-12-31' })
    expect(fetched.length).toBe(5)

    // Import bank statement
    const bankContent = readFileSync(join(fixturesDir, 'csv/mbank-sample.csv'), 'utf-8')
    const transactions = await ksef.bank.importFromString(bankContent)
    expect(transactions.length).toBe(5)

    // Run reconciliation
    const storedInvoices = await ksef.invoices.list()
    const storedTxs = await ksef.bank.list()
    const report = await ksef.reconciliation.run(storedInvoices, storedTxs)

    // Verify
    expect(report.summary.totalInvoices).toBe(5)
    expect(report.summary.totalTransactions).toBe(5)
    expect(report.matched.length).toBeGreaterThanOrEqual(3)
    expect(report.summary.unmatchedInvoiceCount).toBeGreaterThanOrEqual(1)
    expect(report.summary.averageConfidence).toBeGreaterThan(0)
    expect(report.durationMs).toBeGreaterThanOrEqual(0)

    // Pass breakdown should have entries
    const passNames = Object.keys(report.summary.passBreakdown)
    expect(passNames.length).toBeGreaterThan(0)

    // Save and retrieve report
    await ksef.storage.saveReport(report)
    const retrieved = await ksef.storage.getReport(report.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.summary.matchedCount).toBe(report.summary.matchedCount)
  })

  it('validates invoices before reconciliation', () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    const invoices = makeInvoices()
    const reports = ksef.validation.validate(invoices)

    expect(reports).toHaveLength(5)
    // All should pass basic validation (they have required fields)
    for (const report of reports) {
      const errors = report.results.filter((r) => !r.valid)
      // Only NIP format errors are expected for non-standard NIPs
      const criticalErrors = errors.filter((e) => !e.rule.includes('nip'))
      expect(criticalErrors).toHaveLength(0)
    }
  })
})
