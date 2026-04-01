import { describe, it, expect } from 'vitest'
import { BankTransactionSchema } from '../schemas/index.js'

const validTransaction = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  date: '2026-03-01',
  amount: -123000, // outgoing, 1230,00 PLN
  description: 'FV/2026/03/001 za uslugi programistyczne',
  senderName: 'EXAMPLE CORP SP Z OO',
  recipientName: 'TECHSOLUTIONS SP Z OO',
  recipientNIP: '5213456784',
  bank: 'mbank' as const,
  raw: '2026-03-01;2026-03-01;PRZELEW WYCHODZĄCY;FV/2026/03/001;TECHSOLUTIONS SP Z OO;-1230,00;48770,00;',
  createdAt: '2026-03-01T12:00:00Z',
}

describe('BankTransactionSchema', () => {
  it('accepts a valid transaction', () => {
    const result = BankTransactionSchema.safeParse(validTransaction)
    expect(result.success).toBe(true)
  })

  it('accepts negative amount (outgoing)', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      amount: -500000,
    })
    expect(result.success).toBe(true)
  })

  it('accepts positive amount (incoming)', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      amount: 1500000,
    })
    expect(result.success).toBe(true)
  })

  it('accepts zero amount', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      amount: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid bank enum', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      bank: 'invalid_bank',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing description', () => {
    const { description: _, ...withoutDescription } = validTransaction
    const result = BankTransactionSchema.safeParse(withoutDescription)
    expect(result.success).toBe(false)
  })

  it('accepts NIP with invalid checksum (no checksum validation on bank data)', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      recipientNIP: '1234567890', // invalid checksum, but should pass
    })
    expect(result.success).toBe(true)
  })

  it('rejects NIP with wrong format', () => {
    const result = BankTransactionSchema.safeParse({
      ...validTransaction,
      recipientNIP: '12345', // too short
    })
    expect(result.success).toBe(false)
  })

  it('accepts transaction without optional fields', () => {
    const minimal = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-03-01',
      amount: -123000,
      description: 'Test payment',
      bank: 'other',
      raw: 'raw line',
      createdAt: '2026-03-01T12:00:00Z',
    }
    const result = BankTransactionSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })
})
