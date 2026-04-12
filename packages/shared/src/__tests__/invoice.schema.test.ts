import { describe, it, expect } from 'vitest'
import { InvoiceSchema } from '../schemas/index.js'

const validInvoice = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  invoiceNumber: 'FV/2026/03/001',
  sellerNIP: '5213456784',
  buyerNIP: '1234563218',
  grossAmount: 123000, // 1230,00 PLN in grosze
  netAmount: 100000,
  vatAmount: 23000,
  currency: 'PLN' as const,
  issueDate: '2026-03-01',
  ksefReference: '1234567890-20260301-ABC123DEF456',
  sellerName: 'TECHSOLUTIONS SP Z OO',
  buyerName: 'EXAMPLE CORP SP Z OO',
  lineItems: [
    {
      lineNumber: 1,
      description: 'Uslugi programistyczne',
      unit: 'szt',
      quantity: 1,
      unitNetPrice: 100000,
      netAmount: 100000,
      vatRate: 23,
    },
  ],
  createdAt: '2026-03-01T10:00:00Z',
}

describe('InvoiceSchema', () => {
  it('accepts a valid invoice', () => {
    const result = InvoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
  })

  it('accepts invoice without optional fields', () => {
    const minimal = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'FV/2026/03/001',
      sellerNIP: '5213456784',
      grossAmount: 123000,
      currency: 'PLN',
      issueDate: '2026-03-01',
      createdAt: '2026-03-01T10:00:00Z',
    }
    const result = InvoiceSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('rejects invalid NIP checksum', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      sellerNIP: '1234567890',
    })
    expect(result.success).toBe(false)
  })

  it('rejects NIP with wrong length', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      sellerNIP: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid NIP 5213456784', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      sellerNIP: '5213456784',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative grossAmount', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      grossAmount: -100,
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero grossAmount (e.g. correction invoices)', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      grossAmount: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = InvoiceSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('validates lineItems array', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      lineItems: [
        {
          lineNumber: 1,
          description: 'Test',
          netAmount: 50000,
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects lineItem with invalid lineNumber', () => {
    const result = InvoiceSchema.safeParse({
      ...validInvoice,
      lineItems: [
        {
          lineNumber: 0,
          description: 'Test',
          netAmount: 50000,
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
