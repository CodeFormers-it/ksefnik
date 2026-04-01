import { describe, it, expect } from 'vitest'
import type { Invoice } from '@ksefnik/shared'
import { requiredFieldsRule } from '../../validation/rules/required-fields.js'
import { nipFormatRule } from '../../validation/rules/nip-format.js'
import { buyerNipFormatRule } from '../../validation/rules/buyer-nip-format.js'
import { nipNotZerosRule } from '../../validation/rules/nip-not-zeros.js'
import { amountPositiveRule } from '../../validation/rules/amount-positive.js'
import { amountMaxRule } from '../../validation/rules/amount-max.js'
import { dateValidRule } from '../../validation/rules/date-valid.js'
import { dateNotFutureRule } from '../../validation/rules/date-not-future.js'
import { dateOrderRule } from '../../validation/rules/date-order.js'
import { vatRateValidRule } from '../../validation/rules/vat-rate-valid.js'

const validInvoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  invoiceNumber: 'FV/2026/03/001',
  sellerNIP: '5213456784',
  grossAmount: 123000,
  currency: 'PLN',
  issueDate: '2026-03-01',
  createdAt: '2026-03-01T10:00:00Z',
}

describe('required-fields', () => {
  it('passes with all required fields', () => {
    const results = requiredFieldsRule.validate(validInvoice)
    expect(results.every((r) => r.valid)).toBe(true)
  })
})

describe('nip-format', () => {
  it('passes valid NIP', () => {
    const [r] = nipFormatRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails invalid NIP', () => {
    const [r] = nipFormatRule.validate({ ...validInvoice, sellerNIP: '1234567890' } as Invoice)
    expect(r!.valid).toBe(false)
  })
})

describe('buyer-nip-format', () => {
  it('passes when buyerNIP absent', () => {
    const [r] = buyerNipFormatRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes valid buyerNIP', () => {
    const [r] = buyerNipFormatRule.validate({ ...validInvoice, buyerNIP: '1234563218' })
    expect(r!.valid).toBe(true)
  })

  it('fails invalid buyerNIP', () => {
    const [r] = buyerNipFormatRule.validate({ ...validInvoice, buyerNIP: '1234567890' } as Invoice)
    expect(r!.valid).toBe(false)
  })
})

describe('nip-not-zeros', () => {
  it('passes normal NIP', () => {
    const [r] = nipNotZerosRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails all-zeros NIP', () => {
    const [r] = nipNotZerosRule.validate({ ...validInvoice, sellerNIP: '0000000000' } as Invoice)
    expect(r!.valid).toBe(false)
  })
})

describe('amount-positive', () => {
  it('passes positive amount', () => {
    const [r] = amountPositiveRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails zero amount', () => {
    const [r] = amountPositiveRule.validate({ ...validInvoice, grossAmount: 0 } as Invoice)
    expect(r!.valid).toBe(false)
  })

  it('fails negative amount', () => {
    const [r] = amountPositiveRule.validate({ ...validInvoice, grossAmount: -100 } as Invoice)
    expect(r!.valid).toBe(false)
  })
})

describe('amount-max', () => {
  it('passes normal amount', () => {
    const [r] = amountMaxRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails excessive amount', () => {
    const [r] = amountMaxRule.validate({ ...validInvoice, grossAmount: 100_000_000_00 } as Invoice)
    expect(r!.valid).toBe(false)
  })
})

describe('date-valid', () => {
  it('passes valid ISO date', () => {
    const [r] = dateValidRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('fails non-ISO date', () => {
    const [r] = dateValidRule.validate({ ...validInvoice, issueDate: '01-03-2026' })
    expect(r!.valid).toBe(false)
  })
})

describe('date-not-future', () => {
  it('passes past date', () => {
    const [r] = dateNotFutureRule.validate(validInvoice, { now: new Date('2026-03-15') })
    expect(r!.valid).toBe(true)
  })

  it('fails far future date', () => {
    const [r] = dateNotFutureRule.validate(
      { ...validInvoice, issueDate: '2099-01-01' },
      { now: new Date('2026-03-15') },
    )
    expect(r!.valid).toBe(false)
  })

  it('passes tomorrow (1 day tolerance)', () => {
    const [r] = dateNotFutureRule.validate(
      { ...validInvoice, issueDate: '2026-03-16' },
      { now: new Date('2026-03-15') },
    )
    expect(r!.valid).toBe(true)
  })
})

describe('date-order', () => {
  it('passes when no dueDate', () => {
    const [r] = dateOrderRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes when dueDate >= issueDate', () => {
    const [r] = dateOrderRule.validate({ ...validInvoice, dueDate: '2026-03-15' })
    expect(r!.valid).toBe(true)
  })

  it('fails when dueDate < issueDate', () => {
    const [r] = dateOrderRule.validate({ ...validInvoice, dueDate: '2026-02-15' })
    expect(r!.valid).toBe(false)
  })
})

describe('vat-rate-valid', () => {
  it('passes when no lineItems', () => {
    const [r] = vatRateValidRule.validate(validInvoice)
    expect(r!.valid).toBe(true)
  })

  it('passes valid 23% rate', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'Test', netAmount: 100, vatRate: 23 }],
    }
    const results = vatRateValidRule.validate(inv)
    expect(results.every((r) => r.valid)).toBe(true)
  })

  it('fails invalid 10% rate', () => {
    const inv = {
      ...validInvoice,
      lineItems: [{ lineNumber: 1, description: 'Test', netAmount: 100, vatRate: 10 }],
    }
    const results = vatRateValidRule.validate(inv)
    expect(results.some((r) => !r.valid)).toBe(true)
  })
})
