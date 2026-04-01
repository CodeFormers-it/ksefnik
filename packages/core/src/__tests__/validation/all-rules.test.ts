import { describe, it, expect } from 'vitest'
import type { Invoice } from '@ksefnik/shared'
import { invoiceNumberFormatRule } from '../../validation/rules/invoice-number-format.js'
import { duplicateCheckRule } from '../../validation/rules/duplicate-check.js'
import { currencyValidRule } from '../../validation/rules/currency-valid.js'
import { lineItemsSumRule } from '../../validation/rules/line-items-sum.js'
import { vatCalculationRule } from '../../validation/rules/vat-calculation.js'
import { sellerBuyerDifferentRule } from '../../validation/rules/seller-buyer-different.js'
import { dateRangeRule } from '../../validation/rules/date-range.js'
import { quantityPositiveRule } from '../../validation/rules/quantity-positive.js'
import { descriptionLengthRule } from '../../validation/rules/description-length.js'
import { ksefReferenceFormatRule } from '../../validation/rules/ksef-reference-format.js'
import { allRules } from '../../validation/rules/index.js'
import { validateInvoices } from '../../validation/engine.js'

const validInvoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  invoiceNumber: 'FV/2026/03/001',
  sellerNIP: '5213456784',
  grossAmount: 123000,
  netAmount: 100000,
  vatAmount: 23000,
  currency: 'PLN',
  issueDate: '2026-03-01',
  createdAt: '2026-03-01T10:00:00Z',
}

describe('invoice-number-format', () => {
  it('passes normal number', () => {
    const [r] = invoiceNumberFormatRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })
})

describe('duplicate-check', () => {
  it('passes unique invoices', () => {
    const [r] = duplicateCheckRule.validate(validInvoice, { allInvoices: [validInvoice] })
    expect(r!.valid).toBe(true)
  })

  it('fails on duplicate number+NIP', () => {
    const dup = { ...validInvoice, id: '550e8400-e29b-41d4-a716-446655440099' }
    const [r] = duplicateCheckRule.validate(validInvoice, { allInvoices: [validInvoice, dup] })
    expect(r!.valid).toBe(false)
  })
})

describe('currency-valid', () => {
  it('passes PLN', () => {
    const [r] = currencyValidRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })
})

describe('line-items-sum', () => {
  it('passes when no lineItems', () => {
    const [r] = lineItemsSumRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes when sum matches', () => {
    const inv = {
      ...validInvoice,
      lineItems: [
        { lineNumber: 1, description: 'A', netAmount: 60000 },
        { lineNumber: 2, description: 'B', netAmount: 40000 },
      ],
    }
    const [r] = lineItemsSumRule.validate(inv)
    expect(r!.valid).toBe(true)
  })

  it('fails when sum mismatches', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'A', netAmount: 50000 }],
    }
    const [r] = lineItemsSumRule.validate(inv)
    expect(r!.valid).toBe(false)
  })
})

describe('vat-calculation', () => {
  it('passes correct VAT', () => {
    const [r] = vatCalculationRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes with 1 grosz tolerance', () => {
    const inv = { ...validInvoice, vatAmount: 23001 }
    const [r] = vatCalculationRule.validate(inv)
    expect(r!.valid).toBe(true)
  })

  it('fails wrong VAT', () => {
    const inv = { ...validInvoice, vatAmount: 25000 }
    const [r] = vatCalculationRule.validate(inv)
    expect(r!.valid).toBe(false)
  })
})

describe('seller-buyer-different', () => {
  it('passes when no buyer', () => {
    const [r] = sellerBuyerDifferentRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes different NIPs', () => {
    const [r] = sellerBuyerDifferentRule.validate({ ...validInvoice, buyerNIP: '1234563218' })
    expect(r!.valid).toBe(true)
  })

  it('fails same NIPs', () => {
    const [r] = sellerBuyerDifferentRule.validate({ ...validInvoice, buyerNIP: '5213456784' })
    expect(r!.valid).toBe(false)
  })
})

describe('date-range', () => {
  it('passes recent date', () => {
    const [r] = dateRangeRule.validate(validInvoice, { now: new Date('2026-03-15') })
    expect(r!.valid).toBe(true)
  })

  it('fails 11-year-old date', () => {
    const [r] = dateRangeRule.validate(
      { ...validInvoice, issueDate: '2010-01-01' },
      { now: new Date('2026-03-15') },
    )
    expect(r!.valid).toBe(false)
  })
})

describe('quantity-positive', () => {
  it('passes when no lineItems', () => {
    const [r] = quantityPositiveRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails zero quantity', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'A', netAmount: 100, quantity: 0 }],
    }
    const results = quantityPositiveRule.validate(inv)
    expect(results.some((r) => !r.valid)).toBe(true)
  })
})

describe('description-length', () => {
  it('passes short description', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'Short', netAmount: 100 }],
    }
    const results = descriptionLengthRule.validate(inv)
    expect(results.every((r) => r.valid)).toBe(true)
  })

  it('fails 300-char description', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'x'.repeat(300), netAmount: 100 }],
    }
    const results = descriptionLengthRule.validate(inv)
    expect(results.some((r) => !r.valid)).toBe(true)
  })
})

describe('ksef-reference-format', () => {
  it('passes when absent', () => {
    const [r] = ksefReferenceFormatRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes valid format', () => {
    const inv = { ...validInvoice, ksefReference: '1234567890-20260301-ABC123DEF456' }
    const [r] = ksefReferenceFormatRule.validate(inv)
    expect(r!.valid).toBe(true)
  })

  it('fails invalid format', () => {
    const inv = { ...validInvoice, ksefReference: 'invalid-ref' }
    const [r] = ksefReferenceFormatRule.validate(inv)
    expect(r!.valid).toBe(false)
  })
})

describe('allRules', () => {
  it('contains 20 rules', () => {
    expect(allRules).toHaveLength(20)
  })

  it('all pass on valid invoice', () => {
    const reports = validateInvoices([validInvoice], allRules)
    expect(reports[0]!.valid).toBe(true)
  })
})
