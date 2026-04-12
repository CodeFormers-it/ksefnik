import { describe, expect, it } from 'vitest'
import { HttpClient } from '../http.js'
import { KsefApiError, KsefAuthError, KsefRateLimitError } from '../errors.js'

function mockFetchImpl(
  responses: Array<{ status: number; body: string; headers?: Record<string, string> }>,
): typeof fetch & { calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    const r = responses.shift()
    if (!r) throw new Error('mockFetch: no more responses')
    return new Response(r.body, {
      status: r.status,
      headers: r.headers ?? { 'content-type': 'application/json' },
    })
  }) as typeof fetch & { calls: typeof calls }
  Object.defineProperty(impl, 'calls', { value: calls })
  return impl
}

describe('HttpClient.request', () => {
  it('returns parsed JSON on 200', async () => {
    const fetchImpl = mockFetchImpl([{ status: 200, body: '{"ok":true}' }])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    const res = await http.request<{ ok: boolean }>({ method: 'GET', path: '/ping' })
    expect(res.ok).toBe(true)
    expect(fetchImpl.calls[0]?.url).toBe('https://example.test/v2/ping')
  })

  it('adds query params and JSON body', async () => {
    const fetchImpl = mockFetchImpl([{ status: 200, body: '{}' }])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    await http.request({
      method: 'POST',
      path: '/invoices/query/metadata',
      query: { pageSize: 100, pageOffset: 0 },
      body: { filters: { subjectType: 'subject2' } },
      headers: { Authorization: 'Bearer xyz' },
    })
    const call = fetchImpl.calls[0]
    expect(call?.url).toContain('pageSize=100')
    expect(call?.url).toContain('pageOffset=0')
    const headers = call?.init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['Authorization']).toBe('Bearer xyz')
    expect(call?.init.body).toBe('{"filters":{"subjectType":"subject2"}}')
  })

  it('maps 401 to KsefAuthError', async () => {
    const fetchImpl = mockFetchImpl([
      {
        status: 401,
        body: '{"exception":{"exceptionDetailList":[{"exceptionCode":"AUTH_001","exceptionDescription":"Token invalid"}]}}',
      },
    ])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    await expect(
      http.request({ method: 'GET', path: '/protected' }),
    ).rejects.toThrow(KsefAuthError)
  })

  it('maps 429 to KsefRateLimitError with retryAfter from header', async () => {
    const fetchImpl = mockFetchImpl([
      {
        status: 429,
        body: '{"message":"rate limit"}',
        headers: { 'content-type': 'application/json', 'retry-after': '4' },
      },
    ])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    try {
      await http.request({ method: 'GET', path: '/protected' })
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(KsefRateLimitError)
      expect((error as KsefRateLimitError).retryAfter).toBe(4)
    }
  })

  it('maps 500 to KsefApiError', async () => {
    const fetchImpl = mockFetchImpl([{ status: 500, body: '{"message":"boom"}' }])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    await expect(
      http.request({ method: 'GET', path: '/kaboom' }),
    ).rejects.toThrow(KsefApiError)
  })

  it('returns raw text when responseType=text', async () => {
    const fetchImpl = mockFetchImpl([
      { status: 200, body: '<Faktura/>', headers: { 'content-type': 'application/xml' } },
    ])
    const http = new HttpClient({ baseUrl: 'https://example.test/v2', fetchImpl })
    const res = await http.request<string>({
      method: 'GET',
      path: '/invoices/ksef/ABC',
      responseType: 'text',
    })
    expect(res).toBe('<Faktura/>')
  })
})
