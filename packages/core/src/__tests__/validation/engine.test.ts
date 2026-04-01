import { describe, it, expect } from 'vitest'
import type { Invoice } from '@ksefnik/shared'
import { validateInvoice, validateInvoices } from '../../validation/engine.js'
import { requiredFieldsRule } from '../../validation/rules/required-fields.js'
import { amountPositiveRule } from '../../validation/rules/amount-positive.js'

const validInvoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  invoiceNumber: 'FV/2026/03/001',
  sellerNIP: '5213456784',
  grossAmount: 123000,
  currency: 'PLN',
  issueDate: '2026-03-01',
  createdAt: '2026-03-01T10:00:00Z',
}

const rules = [requiredFieldsRule, amountPositiveRule]

describe('validateInvoice', () => {
  it('returns valid for good invoice', () => {
    const report = validateInvoice(validInvoice, rules)
    expect(report.valid).toBe(true)
    expect(report.results.every((r) => r.valid)).toBe(true)
  })

  it('returns invalid for bad invoice', () => {
    const report = validateInvoice({ ...validInvoice, grossAmount: -1 } as Invoice, rules)
    expect(report.valid).toBe(false)
    expect(report.results.some((r) => !r.valid)).toBe(true)
  })
})

describe('validateInvoices', () => {
  it('validates batch of invoices', () => {
    const reports = validateInvoices([validInvoice, validInvoice], rules)
    expect(reports).toHaveLength(2)
    expect(reports.every((r) => r.valid)).toBe(true)
  })
})
