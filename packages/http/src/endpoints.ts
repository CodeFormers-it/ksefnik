export const ENDPOINTS = {
  production: 'https://api.ksef.mf.gov.pl/v2',
  demo: 'https://api-demo.ksef.mf.gov.pl/v2',
  test: 'https://api-test.ksef.mf.gov.pl/v2',
} as const

export type KsefEnvironment = keyof typeof ENDPOINTS

const SAFE_REF_RE = /^[A-Za-z0-9_-]{1,128}$/

function assertSafeReference(value: string, field: string): string {
  if (!SAFE_REF_RE.test(value)) {
    throw new Error(
      `Invalid ${field}: must match ${SAFE_REF_RE.toString()} (got: ${JSON.stringify(value)})`,
    )
  }
  return value
}

export const PATHS = {
  authChallenge: '/auth/challenge',
  authKsefToken: '/auth/ksef-token',
  authStatus: (referenceNumber: string): string =>
    `/auth/${assertSafeReference(referenceNumber, 'referenceNumber')}`,
  authRedeem: '/auth/token/redeem',
  authRefresh: '/auth/token/refresh',
  sessionsList: '/auth/sessions',
  sessionRevokeCurrent: '/auth/sessions/current',
  sessionRevokeByRef: (referenceNumber: string): string =>
    `/auth/sessions/${assertSafeReference(referenceNumber, 'referenceNumber')}`,
  queryMetadata: '/invoices/query/metadata',
  invoiceByKsefNumber: (ksefNumber: string): string =>
    `/invoices/ksef/${assertSafeReference(ksefNumber, 'ksefNumber')}`,
  invoiceStatus: (sessionRef: string, invoiceRef: string): string =>
    `/sessions/${assertSafeReference(sessionRef, 'sessionReferenceNumber')}/invoices/${assertSafeReference(invoiceRef, 'invoiceReferenceNumber')}`,
  invoiceUpoByKsefNumber: (sessionRef: string, ksefNumber: string): string =>
    `/sessions/${assertSafeReference(sessionRef, 'sessionReferenceNumber')}/invoices/ksef/${assertSafeReference(ksefNumber, 'ksefNumber')}/upo`,
  publicKeyCertificates: '/security/public-key-certificates',
} as const
