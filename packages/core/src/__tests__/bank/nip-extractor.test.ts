import { describe, it, expect } from 'vitest'
import { extractNIPs, extractFirstNIP } from '../../bank/nip-extractor.js'

describe('extractNIPs', () => {
  it('extracts NIP from MPP format /NIP/.../', () => {
    const result = extractNIPs('/VAT/230.00/IDC/1234563218/INV/FV001/NIP/5213456784/')
    expect(result).toContain('5213456784')
    expect(result).toContain('1234563218')
  })

  it('extracts NIP from "NIP: 1234567890" prefix', () => {
    const result = extractNIPs('Przelew od TECHSOLUTIONS NIP: 5213456784')
    expect(result).toContain('5213456784')
  })

  it('extracts NIP from "NIP 1234567890" prefix (no colon)', () => {
    const result = extractNIPs('FIRMA ABC NIP 7740001454 Warszawa')
    expect(result).toContain('7740001454')
  })

  it('extracts raw 10-digit NIP with valid checksum', () => {
    const result = extractNIPs('Dane kontrahenta 5213456784 ul Marszalkowska')
    expect(result).toContain('5213456784')
  })

  it('does NOT extract 10-digit number with invalid checksum', () => {
    const result = extractNIPs('Konto 1234567890 saldo')
    expect(result).not.toContain('1234567890')
  })

  it('extracts multiple NIPs', () => {
    const result = extractNIPs('NIP: 5213456784 przelew do NIP: 7740001454')
    expect(result).toHaveLength(2)
  })

  it('deduplicates NIPs', () => {
    const result = extractNIPs('NIP: 5213456784 powtorzone NIP5213456784')
    expect(result).toHaveLength(1)
  })

  it('returns empty for no NIPs', () => {
    const result = extractNIPs('Przelew bez numeru NIP')
    expect(result).toEqual([])
  })
})

describe('extractFirstNIP', () => {
  it('returns first NIP', () => {
    expect(extractFirstNIP('NIP: 5213456784 i NIP: 7740001454')).toBe('5213456784')
  })

  it('returns undefined when no NIP', () => {
    expect(extractFirstNIP('brak nip')).toBeUndefined()
  })
})
