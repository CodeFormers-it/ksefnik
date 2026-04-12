import { withHttpRetry, type HttpRetryOptions } from './retry.js'
import type {
  KsefClient,
  KsefClientConfig,
  KsefSessionState,
  KsefRawInvoice,
} from '@ksefnik/core'

import { ENDPOINTS, type KsefEnvironment } from './endpoints.js'
import { HttpClient } from './http.js'
import {
  initKsefSession,
  refreshAccessToken,
  revokeCurrentSession,
  shouldRefresh,
  type ActiveSession,
} from './session.js'
import { fetchInvoices as fetchInvoicesHttp } from './invoices.js'
import { fetchKsefTokenEncryptionKey } from './public-key.js'

export interface KsefHttpClientOptions {
  environment: KsefEnvironment
  /**
   * MF RSA public key in PEM/SPKI format used for `/auth/ksef-token` encryption.
   * If omitted, the client auto-fetches it from `GET /security/public-key-certificates`
   * on first `initSession()` call and caches it for the lifetime of the client.
   */
  publicKeyPem?: string
  baseUrl?: string
  fetchImpl?: typeof fetch
  userAgent?: string
  timeoutMs?: number
  retry?: HttpRetryOptions
}

/**
 * Delimiter between fields of the encoded session token. JWTs (access and
 * refresh tokens returned by KSeF 2.0) are base64url-encoded and cannot
 * contain `||`, so this round-trips safely through `KsefClient.fetchInvoices`.
 */
const SESSION_TOKEN_SEPARATOR = '||'

function encodeSessionToken(session: ActiveSession): string {
  return [
    'v1',
    session.accessToken,
    session.refreshToken,
    session.accessExpiresAt.toISOString(),
    session.referenceNumber,
  ].join(SESSION_TOKEN_SEPARATOR)
}

function decodeSessionToken(token: string): ActiveSession | null {
  const parts = token.split(SESSION_TOKEN_SEPARATOR)
  if (parts.length !== 5 || parts[0] !== 'v1') return null
  const [, accessToken, refreshToken, expiresAtIso, referenceNumber] = parts as [
    string,
    string,
    string,
    string,
    string,
  ]
  const accessExpiresAt = new Date(expiresAtIso)
  if (Number.isNaN(accessExpiresAt.getTime())) return null
  return { accessToken, refreshToken, accessExpiresAt, referenceNumber }
}

export class KsefHttpClient implements KsefClient {
  private readonly http: HttpClient
  private readonly retryOpts: HttpRetryOptions
  private cachedPublicKeyPem: string | undefined

  constructor(private readonly opts: KsefHttpClientOptions) {
    const baseUrl = opts.baseUrl ?? ENDPOINTS[opts.environment]
    this.http = new HttpClient({
      baseUrl,
      fetchImpl: opts.fetchImpl,
      userAgent: opts.userAgent,
      defaultTimeoutMs: opts.timeoutMs,
    })
    this.retryOpts = opts.retry ?? {}
    this.cachedPublicKeyPem = opts.publicKeyPem
  }

  private async resolvePublicKey(): Promise<string> {
    if (this.cachedPublicKeyPem) return this.cachedPublicKeyPem
    const pem = await fetchKsefTokenEncryptionKey(this.http)
    this.cachedPublicKeyPem = pem
    return pem
  }

  async initSession(config: KsefClientConfig): Promise<KsefSessionState> {
    if (!config.token) {
      throw new Error('KsefHttpClient.initSession: config.token (KSeF token) is required')
    }
    const publicKeyPem = await this.resolvePublicKey()
    const session = await withHttpRetry(
      () =>
        initKsefSession(this.http, {
          nip: config.nip,
          ksefToken: config.token,
          publicKeyPem,
        }),
      this.retryOpts,
    )

    return {
      token: encodeSessionToken(session),
      nip: config.nip,
      environment: config.environment,
      expiresAt: session.accessExpiresAt,
      referenceNumber: session.referenceNumber,
    }
  }

  async terminateSession(token: string): Promise<void> {
    const session = decodeSessionToken(token)
    if (!session) return
    await revokeCurrentSession(this.http, session)
  }

  async fetchInvoices(params: {
    token: string
    dateFrom: string
    dateTo: string
    subjectNip?: string
    subjectType?: 'Subject1' | 'Subject2' | 'Subject3'
    pageSize?: number
    pageOffset?: number
  }): Promise<{ invoices: KsefRawInvoice[]; total: number }> {
    let session = decodeSessionToken(params.token)
    if (!session) {
      throw new Error(
        'KsefHttpClient.fetchInvoices: invalid session token — expected the opaque ' +
          'string returned by initSession() (format `v1||access||refresh||validUntil||ref`), ' +
          'not a raw KSeF or JWT token',
      )
    }
    if (shouldRefresh(session)) {
      session = await withHttpRetry(() => refreshAccessToken(this.http, session as ActiveSession), this.retryOpts)
    }

    const result = await withHttpRetry(
      () =>
        fetchInvoicesHttp(this.http, {
          accessToken: (session as ActiveSession).accessToken,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          pageSize: params.pageSize,
          pageOffset: params.pageOffset,
          subjectType: params.subjectType ?? 'Subject2',
        }),
      this.retryOpts,
    )
    return result
  }

  async sendInvoice(): Promise<{ ksefReferenceNumber: string; timestamp: string }> {
    throw new Error(
      'KsefHttpClient.sendInvoice: not implemented in HTTP client MVP — see http_plan.md §H05.5',
    )
  }

  async getUpo(): Promise<{ xml: string; status: 'confirmed' | 'pending' | 'rejected' }> {
    throw new Error('KsefHttpClient.getUpo: not implemented in HTTP client MVP')
  }
}
