import { describe, it, expect } from 'vitest'
import { MatchSchema } from '../schemas/index.js'

const validMatch = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  invoiceId: '550e8400-e29b-41d4-a716-446655440000',
  transactionId: '550e8400-e29b-41d4-a716-446655440001',
  confidence: 95,
  passName: 'exact-nip',
  reasons: ['NIP match', 'Amount match'],
  confirmed: false,
  createdAt: '2026-03-15T14:00:00Z',
}

describe('MatchSchema', () => {
  it('accepts a valid match', () => {
    const result = MatchSchema.safeParse(validMatch)
    expect(result.success).toBe(true)
  })

  it('defaults confirmed to false when omitted', () => {
    const { confirmed: _, ...withoutConfirmed } = validMatch
    const result = MatchSchema.safeParse(withoutConfirmed)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.confirmed).toBe(false)
    }
  })

  it('accepts optional transactionIds for partial matches', () => {
    const result = MatchSchema.safeParse({
      ...validMatch,
      transactionIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects confidence below 0', () => {
    const result = MatchSchema.safeParse({ ...validMatch, confidence: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects confidence above 100', () => {
    const result = MatchSchema.safeParse({ ...validMatch, confidence: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer confidence', () => {
    const result = MatchSchema.safeParse({ ...validMatch, confidence: 95.5 })
    expect(result.success).toBe(false)
  })

  it('rejects empty reasons array is valid', () => {
    const result = MatchSchema.safeParse({ ...validMatch, reasons: [] })
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID for invoiceId', () => {
    const result = MatchSchema.safeParse({ ...validMatch, invoiceId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})
