import { describe, expect, it } from 'vitest'
import { HttpClient } from '../http.js'
import { fetchInvoices } from '../invoices.js'

interface MockResponse {
  status: number
  body: string
  headers?: Record<string, string>
}

function mockFetch(routes: Array<(req: { url: string; body: unknown }) => MockResponse>) {
  let index = 0
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = init?.body
      ? (() => {
          try {
            return JSON.parse(String(init.body))
          } catch {
            return init.body
          }
        })()
      : undefined
    const handler = routes[index++]
    if (!handler) throw new Error(`mockFetch: no handler for call #${index}`)
    const r = handler({ url, body })
    return new Response(r.body, {
      status: r.status,
      headers: r.headers ?? { 'content-type': 'application/json' },
    })
  }) as typeof fetch
  return impl
}

describe('fetchInvoices pagination (hasMore semantics)', () => {
  it('continues paging when page is exactly pageSize and hasMore=true', async () => {
    // First page: 2 items, hasMore: true (even though items.length === pageSize).
    // Second page: 1 item, hasMore: false.
    // Bug fix verification: total must be 3, not 2.
    const page1Items = [
      { ksefNumber: 'K-1', invoiceNumber: 'FV/1', seller: { nip: '111' }, grossAmount: 10 },
      { ksefNumber: 'K-2', invoiceNumber: 'FV/2', seller: { nip: '111' }, grossAmount: 20 },
    ]
    const page2Items = [
      { ksefNumber: 'K-3', invoiceNumber: 'FV/3', seller: { nip: '111' }, grossAmount: 30 },
    ]

    const fetchImpl = mockFetch([
      () => ({
        status: 200,
        body: JSON.stringify({ hasMore: true, isTruncated: false, invoices: page1Items }),
      }),
      () => ({
        status: 200,
        body: JSON.stringify({ hasMore: false, isTruncated: false, invoices: page2Items }),
      }),
    ])

    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    const { invoices } = await fetchInvoices(http, {
      accessToken: 't',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      pageSize: 2,
    })
    expect(invoices).toHaveLength(3)
    expect(invoices.map((i) => i.ksefReferenceNumber)).toEqual(['K-1', 'K-2', 'K-3'])
  })

  it('stops at hasMore=false even when page is full', async () => {
    const fetchImpl = mockFetch([
      () => ({
        status: 200,
        body: JSON.stringify({
          hasMore: false,
          invoices: [
            { ksefNumber: 'K-1', invoiceNumber: 'FV/1', seller: { nip: '111' }, grossAmount: 10 },
            { ksefNumber: 'K-2', invoiceNumber: 'FV/2', seller: { nip: '111' }, grossAmount: 20 },
          ],
        }),
      }),
    ])

    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    const { invoices } = await fetchInvoices(http, {
      accessToken: 't',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      pageSize: 2,
    })
    expect(invoices).toHaveLength(2)
  })

  it('stops on empty page even if hasMore=true (guard against infinite loop)', async () => {
    const fetchImpl = mockFetch([
      () => ({
        status: 200,
        body: JSON.stringify({ hasMore: true, invoices: [] }),
      }),
    ])

    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    const { invoices } = await fetchInvoices(http, {
      accessToken: 't',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    })
    expect(invoices).toHaveLength(0)
  })
})
