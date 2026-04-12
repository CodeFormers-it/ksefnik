import { buildEncryptedToken } from './crypto.js'
import { PATHS } from './endpoints.js'
import { KsefApiError } from './errors.js'
import type { HttpClient } from './http.js'
import type {
  KsefAuthenticationChallengeResponse,
  KsefAuthenticationInitResponse,
  KsefAuthenticationOperationStatusResponse,
  KsefAuthenticationTokenRefreshResponse,
  KsefAuthenticationTokensResponse,
  KsefInitTokenAuthenticationRequest,
} from './generated/index.js'

// Local aliases: the contract types are the source of truth; these names
// are kept for grep-friendliness with the previous hand-written interfaces.
export type ChallengeResponse = KsefAuthenticationChallengeResponse
export type AuthenticationTokenResponse = KsefAuthenticationInitResponse
export type AuthenticationOperationStatusResponse = KsefAuthenticationOperationStatusResponse
export type RedeemedTokens = KsefAuthenticationTokensResponse
export type RefreshTokenResponse = KsefAuthenticationTokenRefreshResponse

export interface ActiveSession {
  accessToken: string
  refreshToken: string
  accessExpiresAt: Date
  referenceNumber: string
}

export interface InitSessionInput {
  nip: string
  ksefToken: string
  publicKeyPem: string
}

const DEFAULT_REFRESH_BUFFER_MS = 60_000
const AUTH_POLL_MAX_ATTEMPTS = 30
const AUTH_POLL_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForAuthSuccess(
  http: HttpClient,
  referenceNumber: string,
  authenticationToken: string,
): Promise<void> {
  for (let attempt = 0; attempt < AUTH_POLL_MAX_ATTEMPTS; attempt++) {
    const status = await http.request<AuthenticationOperationStatusResponse>({
      method: 'GET',
      path: PATHS.authStatus(referenceNumber),
      headers: { Authorization: `Bearer ${authenticationToken}` },
    })
    const code = status.status?.code
    if (code === 200) return
    if (typeof code === 'number' && code >= 400) {
      throw new KsefApiError(
        `Authentication failed: ${status.status.description}${
          status.status.details ? ` — ${status.status.details.join('; ')}` : ''
        }`,
        code,
        undefined,
        'AUTH_FAILED',
      )
    }
    await sleep(AUTH_POLL_DELAY_MS)
  }
  throw new KsefApiError(
    `Authentication polling timed out after ${AUTH_POLL_MAX_ATTEMPTS} attempts`,
    undefined,
    undefined,
    'AUTH_POLL_TIMEOUT',
  )
}

function parseValidUntil(validUntil: string): Date {
  const d = new Date(validUntil)
  if (Number.isNaN(d.getTime())) {
    throw new KsefApiError(
      `Invalid validUntil timestamp: ${validUntil}`,
      undefined,
      undefined,
      'INVALID_TOKEN_EXPIRY',
    )
  }
  return d
}

export async function initKsefSession(
  http: HttpClient,
  input: InitSessionInput,
): Promise<ActiveSession> {
  // NOTE: `/auth/challenge` takes no request body in KSeF 2.0 PR. The endpoint
  // is unauthenticated and returns a challenge bound to the caller's IP.
  const challenge = await http.request<ChallengeResponse>({
    method: 'POST',
    path: PATHS.authChallenge,
  })

  if (!challenge.challenge || typeof challenge.challenge !== 'string') {
    throw new KsefApiError(
      'Invalid challenge response: missing challenge field',
      undefined,
      undefined,
      'INVALID_CHALLENGE',
    )
  }
  if (
    typeof challenge.timestampMs !== 'number' ||
    !Number.isFinite(challenge.timestampMs) ||
    challenge.timestampMs <= 0
  ) {
    throw new KsefApiError(
      `Invalid challenge timestampMs: ${JSON.stringify(challenge.timestampMs)}`,
      undefined,
      undefined,
      'INVALID_CHALLENGE_TIMESTAMP',
    )
  }

  // Per KSeF 2.0 spec: RSA-OAEP(SHA-256) over `"{ksefToken}|{timestampMs}"`,
  // where `timestampMs` is the exact integer returned by `/auth/challenge`.
  const encryptedToken = buildEncryptedToken(
    input.ksefToken,
    String(challenge.timestampMs),
    input.publicKeyPem,
  )

  const authRequestBody: KsefInitTokenAuthenticationRequest = {
    challenge: challenge.challenge,
    contextIdentifier: { type: 'Nip', value: input.nip },
    encryptedToken,
  }
  const authResponse = await http.request<AuthenticationTokenResponse>({
    method: 'POST',
    path: PATHS.authKsefToken,
    body: authRequestBody,
  })

  // Poll until server-side authentication completes (OCSP/CRL verification).
  await waitForAuthSuccess(
    http,
    authResponse.referenceNumber,
    authResponse.authenticationToken.token,
  )

  const redeemed = await http.request<RedeemedTokens>({
    method: 'POST',
    path: PATHS.authRedeem,
    headers: { Authorization: `Bearer ${authResponse.authenticationToken.token}` },
  })

  return {
    accessToken: redeemed.accessToken.token,
    refreshToken: redeemed.refreshToken.token,
    accessExpiresAt: parseValidUntil(redeemed.accessToken.validUntil),
    referenceNumber: authResponse.referenceNumber,
  }
}

export async function refreshAccessToken(
  http: HttpClient,
  session: ActiveSession,
): Promise<ActiveSession> {
  const refreshed = await http.request<RefreshTokenResponse>({
    method: 'POST',
    path: PATHS.authRefresh,
    headers: { Authorization: `Bearer ${session.refreshToken}` },
  })

  return {
    ...session,
    accessToken: refreshed.accessToken.token,
    accessExpiresAt: parseValidUntil(refreshed.accessToken.validUntil),
  }
}

export function shouldRefresh(
  session: ActiveSession,
  now: Date = new Date(),
  bufferMs: number = DEFAULT_REFRESH_BUFFER_MS,
): boolean {
  return session.accessExpiresAt.getTime() - now.getTime() <= bufferMs
}

/**
 * Best-effort session revocation. Swallows all errors — revocation failures
 * are never user-actionable and must not mask the real result of the
 * preceding operation (e.g. a successful `fetchInvoices()` should not be
 * turned into a failure because teardown hit a 429 or network blip).
 */
export async function revokeCurrentSession(
  http: HttpClient,
  session: ActiveSession,
): Promise<void> {
  try {
    await http.request<unknown>({
      method: 'DELETE',
      path: PATHS.sessionRevokeCurrent,
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
  } catch {
    // intentionally swallowed
  }
}
