import { describe, expect, it } from 'vitest'
import { PATHS } from '../endpoints.js'
import { parseInvoiceXml } from '../xml.js'

describe('PATHS — path traversal guard', () => {
  it('rejects traversal in ksef reference number', () => {
    expect(() => PATHS.invoiceByKsefNumber('../../etc/passwd')).toThrow(/Invalid ksefNumber/)
  })

  it('rejects empty reference', () => {
    expect(() => PATHS.invoiceByKsefNumber('')).toThrow(/Invalid ksefNumber/)
  })

  it('rejects slash in reference', () => {
    expect(() => PATHS.invoiceByKsefNumber('abc/def')).toThrow(/Invalid ksefNumber/)
  })

  it('accepts alphanumeric with dashes and underscores', () => {
    expect(PATHS.invoiceByKsefNumber('KSEF-2026-01_AB')).toBe(
      '/invoices/ksef/KSEF-2026-01_AB',
    )
  })

  it('rejects sessions/{ref} with traversal', () => {
    expect(() => PATHS.sessionRevokeByRef('../current')).toThrow(/Invalid referenceNumber/)
  })
})

describe('parseInvoiceXml — size guard', () => {
  it('rejects XML larger than 5 MB', () => {
    const huge = '<Faktura>' + 'x'.repeat(6 * 1024 * 1024) + '</Faktura>'
    expect(() => parseInvoiceXml(huge)).toThrow(/exceeds.*byte limit/)
  })
})
