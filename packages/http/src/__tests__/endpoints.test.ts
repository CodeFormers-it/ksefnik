import { describe, expect, it } from 'vitest'
import { ENDPOINTS, PATHS } from '../endpoints.js'

describe('ENDPOINTS', () => {
  it('points to KSeF 2.0 /v2 base URLs', () => {
    expect(ENDPOINTS.production).toBe('https://api.ksef.mf.gov.pl/v2')
    expect(ENDPOINTS.demo).toBe('https://api-demo.ksef.mf.gov.pl/v2')
    expect(ENDPOINTS.test).toBe('https://api-test.ksef.mf.gov.pl/v2')
  })
})

describe('PATHS', () => {
  it('includes the KSeF 2.0 auth flow', () => {
    expect(PATHS.authChallenge).toBe('/auth/challenge')
    expect(PATHS.authKsefToken).toBe('/auth/ksef-token')
    expect(PATHS.authRedeem).toBe('/auth/token/redeem')
    expect(PATHS.authRefresh).toBe('/auth/token/refresh')
  })

  it('includes invoice query and fetch', () => {
    expect(PATHS.queryMetadata).toBe('/invoices/query/metadata')
    expect(PATHS.invoiceByKsefNumber('ABC-123')).toBe('/invoices/ksef/ABC-123')
  })

  it('includes session revocation', () => {
    expect(PATHS.sessionRevokeCurrent).toBe('/auth/sessions/current')
    expect(PATHS.sessionRevokeByRef('REF-1')).toBe('/auth/sessions/REF-1')
  })
})
