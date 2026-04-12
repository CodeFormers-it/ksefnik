import { describe, expect, it } from 'vitest'
import { createHttpAdapter } from '../adapter.js'

const VALID_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`

describe('createHttpAdapter', () => {
  it('throws when nip missing', () => {
    expect(() =>
      createHttpAdapter({ nip: '', token: 'x', environment: 'test', publicKeyPem: VALID_PEM }),
    ).toThrow(/nip is required/)
  })

  it('throws when token missing', () => {
    expect(() =>
      createHttpAdapter({ nip: '1', token: '', environment: 'test', publicKeyPem: VALID_PEM }),
    ).toThrow(/token is required/)
  })

  it('allows publicKeyPem to be omitted (auto-fetch on initSession)', () => {
    const adapter = createHttpAdapter({
      nip: '1',
      token: 't',
      environment: 'test',
    })
    expect(typeof adapter.fetchInvoices).toBe('function')
  })

  it('returns a KsefAdapter with fetchInvoices + initSession', () => {
    const adapter = createHttpAdapter({
      nip: '7010002137',
      token: 'ksef-token-xyz',
      environment: 'test',
      publicKeyPem: VALID_PEM,
    })
    expect(typeof adapter.fetchInvoices).toBe('function')
    expect(typeof adapter.initSession).toBe('function')
    expect(typeof adapter.closeSession).toBe('function')
  })
})
