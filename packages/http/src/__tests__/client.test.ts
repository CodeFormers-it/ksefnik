import { describe, expect, it, beforeAll } from 'vitest'
import { webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { KsefHttpClient } from '../client.js'

interface MockResponseDef {
  status: number
  body: string
  headers?: Record<string, string>
}

interface RouteHandler {
  (req: { url: string; method: string; headers: Record<string, string>; body: unknown }): MockResponseDef
}

function makeMockFetch(routes: Record<string, RouteHandler>) {
  const calls: Array<{ url: string; method: string }> = []
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push({ url, method })
    const urlNoQuery = url.split('?')[0]!
    const routeKey = `${method} ${urlNoQuery}`
    const handler = routes[routeKey]
    if (!handler) throw new Error(`mockFetch: no route for ${routeKey}`)
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const [k, v] of Object.entries(h)) headers[k.toLowerCase()] = v
    }
    const parsedBody: unknown = init?.body
      ? (() => {
          try {
            return JSON.parse(String(init.body))
          } catch {
            return init.body
          }
        })()
      : undefined
    const res = handler({ url, method, headers, body: parsedBody })
    return new Response(res.body, {
      status: res.status,
      headers: res.headers ?? { 'content-type': 'application/json' },
    })
  }) as typeof fetch
  return Object.assign(impl, { calls })
}

async function generateKeyPair(): Promise<{ publicPem: string; privateKey: CryptoKey }> {
  const pair = await webcrypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  )
  const spki = await webcrypto.subtle.exportKey('spki', pair.publicKey)
  const b64 = Buffer.from(spki).toString('base64')
  const chunks = b64.match(/.{1,64}/g) ?? [b64]
  const pem = `-----BEGIN PUBLIC KEY-----\n${chunks.join('\n')}\n-----END PUBLIC KEY-----\n`
  return { publicPem: pem, privateKey: pair.privateKey }
}

let publicPem: string
let privateKey: CryptoKey

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const fa2Xml = readFileSync(path.join(fixtureDir, 'fixtures', 'fa2-invoice.xml'), 'utf8')

beforeAll(async () => {
  const pair = await generateKeyPair()
  publicPem = pair.publicPem
  privateKey = pair.privateKey
})

function futureValidUntil(): string {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString()
}

describe('KsefHttpClient full flow', () => {
  it('initSession → fetchInvoices → terminateSession against mocked MF endpoints', async () => {
    const BASE = 'https://example.test/v2'
    const fetchImpl = makeMockFetch({
      [`POST ${BASE}/auth/challenge`]: () => ({
        status: 200,
        body: JSON.stringify({
          challenge: 'CHALLENGE-123',
          timestamp: '2026-04-11T18:09:48.6432641+00:00',
          timestampMs: 1744395288643,
          clientIp: '127.0.0.1',
        }),
      }),
      [`POST ${BASE}/auth/ksef-token`]: () => ({
        status: 200,
        body: JSON.stringify({
          authenticationToken: { token: 'auth-jwt' },
          referenceNumber: 'REF-ABC',
        }),
      }),
      [`GET ${BASE}/auth/REF-ABC`]: () => ({
        status: 200,
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          authenticationMethod: 'Token',
          status: { code: 200, description: 'Uwierzytelnianie zakończone sukcesem' },
        }),
      }),
      [`POST ${BASE}/auth/token/redeem`]: () => ({
        status: 200,
        body: JSON.stringify({
          accessToken: { token: 'access-jwt', validUntil: futureValidUntil() },
          refreshToken: { token: 'refresh-jwt', validUntil: futureValidUntil() },
        }),
      }),
      [`POST ${BASE}/invoices/query/metadata`]: () => ({
        status: 200,
        body: JSON.stringify({
          hasMore: false,
          invoices: [
            {
              ksefNumber: 'KSEF-2026-0001',
              invoiceNumber: 'FV/2026/03/42',
              invoicingDate: '2026-03-15T10:00:00.000+00:00',
              issueDate: '2026-03-15',
              seller: { nip: '5252344078', name: 'Acme Sp. z o.o.' },
              buyer: { identifier: { type: 'Nip', value: '7010002137' }, name: 'Build Eco' },
              netAmount: 1003.7,
              grossAmount: 1234.56,
              currency: 'PLN',
            },
          ],
        }),
      }),
      [`DELETE ${BASE}/auth/sessions/current`]: () => ({
        status: 200,
        body: '{}',
      }),
    })

    const client = new KsefHttpClient({
      environment: 'test',
      baseUrl: BASE,
      publicKeyPem: publicPem,
      fetchImpl,
      retry: { maxAttempts: 1 },
    })

    const session = await client.initSession({
      nip: '7010002137',
      environment: 'test',
      token: 'ksef-token-xyz',
    })
    expect(session.token).toContain('||')
    expect(session.referenceNumber).toBe('REF-ABC')
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())

    const { invoices, total } = await client.fetchInvoices({
      token: session.token,
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
    })

    expect(total).toBe(1)
    expect(invoices).toHaveLength(1)
    const invoice = invoices[0]!
    expect(invoice.ksefReferenceNumber).toBe('KSEF-2026-0001')
    expect(invoice.invoiceNumber).toBe('FV/2026/03/42')
    expect(invoice.subjectNip).toBe('5252344078')
    expect(invoice.xml).toBe('')

    await client.terminateSession(session.token)
    expect(fetchImpl.calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/auth/sessions/current'))).toBe(true)
    // privateKey is used by crypto sanity test below — keep reference to avoid unused-var warnings
    expect(privateKey).toBeDefined()
  })

  it('paginates invoice metadata when total > pageSize', async () => {
    const BASE = 'https://example.test/v2'
    let page = 0
    const fetchImpl = makeMockFetch({
      [`POST ${BASE}/auth/challenge`]: () => ({
        status: 200,
        body: JSON.stringify({
          challenge: 'C',
          timestamp: new Date().toISOString(),
          timestampMs: Date.now(),
          clientIp: '127.0.0.1',
        }),
      }),
      [`POST ${BASE}/auth/ksef-token`]: () => ({
        status: 200,
        body: JSON.stringify({
          authenticationToken: { token: 'a' },
          referenceNumber: 'R',
        }),
      }),
      [`GET ${BASE}/auth/R`]: () => ({
        status: 200,
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          authenticationMethod: 'Token',
          status: { code: 200, description: 'OK' },
        }),
      }),
      [`POST ${BASE}/auth/token/redeem`]: () => ({
        status: 200,
        body: JSON.stringify({
          accessToken: { token: 'a', validUntil: futureValidUntil() },
          refreshToken: { token: 'r', validUntil: futureValidUntil() },
        }),
      }),
      [`POST ${BASE}/invoices/query/metadata`]: () => {
        page++
        const items =
          page === 1
            ? Array.from({ length: 2 }, (_, i) => ({
                ksefNumber: `KSEF-P1-${i}`,
                invoiceNumber: `FV/1/${i}`,
                invoicingDate: '2026-03-01T00:00:00.000+00:00',
                seller: { nip: '5252344078' },
                grossAmount: 100,
                currency: 'PLN',
              }))
            : [
                {
                  ksefNumber: 'KSEF-P2-0',
                  invoiceNumber: 'FV/2/0',
                  invoicingDate: '2026-03-02T00:00:00.000+00:00',
                  seller: { nip: '5252344078' },
                  grossAmount: 200,
                  currency: 'PLN',
                },
              ]
        return {
          status: 200,
          body: JSON.stringify({ hasMore: page === 1, invoices: items }),
        }
      },
    })
    // `fa2Xml` is no longer needed since metadata flow skips XML fetch; keep reference.
    void fa2Xml

    const client = new KsefHttpClient({
      environment: 'test',
      baseUrl: BASE,
      publicKeyPem: publicPem,
      fetchImpl,
      retry: { maxAttempts: 1 },
    })

    const session = await client.initSession({
      nip: '7010002137',
      environment: 'test',
      token: 'ksef-token',
    })

    const { invoices } = await client.fetchInvoices({
      token: session.token,
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      pageSize: 2,
    })
    expect(invoices).toHaveLength(3)
    expect(page).toBe(2)
  })

  it('sendInvoice throws Not implemented', async () => {
    const client = new KsefHttpClient({
      environment: 'test',
      baseUrl: 'https://example.test/v2',
      publicKeyPem: publicPem,
      fetchImpl: makeMockFetch({}),
    })
    await expect(client.sendInvoice()).rejects.toThrow(/not implemented/i)
  })

  it('getUpo rejects invalid session token', async () => {
    const client = new KsefHttpClient({
      environment: 'test',
      baseUrl: 'https://example.test/v2',
      publicKeyPem: publicPem,
      fetchImpl: makeMockFetch({}),
    })
    await expect(
      client.getUpo({ token: 'invalid', ksefReferenceNumber: 'KSEF-123' }),
    ).rejects.toThrow(/invalid session token/i)
  })
})
