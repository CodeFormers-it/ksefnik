import { KsefApiError, KsefAuthError, KsefRateLimitError } from './errors.js'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  query?: Record<string, string | number | undefined>
  headers?: Record<string, string>
  body?: unknown
  responseType?: 'json' | 'text'
  timeoutMs?: number
}

export interface HttpClientOptions {
  baseUrl: string
  fetchImpl?: typeof fetch
  userAgent?: string
  defaultTimeoutMs?: number
}

interface KsefErrorPayload {
  exception?: {
    exceptionDetailList?: Array<{
      exceptionCode?: string
      exceptionDescription?: string
    }>
  }
  error?: string
  message?: string
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions['query'],
): string {
  const url = new URL(baseUrl.replace(/\/$/, '') + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function extractErrorMessage(status: number, payload: unknown): {
  message: string
  detailCode?: string
} {
  if (payload && typeof payload === 'object') {
    const typed = payload as KsefErrorPayload
    const firstDetail = typed.exception?.exceptionDetailList?.[0]
    if (firstDetail?.exceptionDescription) {
      return {
        message: firstDetail.exceptionDescription,
        detailCode: firstDetail.exceptionCode,
      }
    }
    if (typed.message) return { message: typed.message }
    if (typed.error) return { message: typed.error }
  }
  if (typeof payload === 'string' && payload.length > 0) {
    return { message: payload }
  }
  return { message: `HTTP ${status}` }
}

export class HttpClient {
  private readonly fetchImpl: typeof fetch
  private readonly userAgent: string
  private readonly defaultTimeoutMs: number

  constructor(private readonly opts: HttpClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch
    this.userAgent = opts.userAgent ?? 'ksefnik-http/0.1.0'
    this.defaultTimeoutMs = opts.defaultTimeoutMs ?? 30_000
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const url = buildUrl(this.opts.baseUrl, options.path, options.query)
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.userAgent,
      ...options.headers,
    }

    let body: BodyInit | undefined
    if (options.body !== undefined) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    }

    const timeout = options.timeoutMs ?? this.defaultTimeoutMs
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      })
    } catch (error: unknown) {
      clearTimeout(timer)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new KsefApiError(`Request timed out after ${timeout}ms`, undefined, undefined, 'TIMEOUT', {
          url,
        })
      }
      throw new KsefApiError(
        error instanceof Error ? `Network error: ${error.message}` : 'Network error',
        undefined,
        undefined,
        'NETWORK',
        { url },
      )
    } finally {
      clearTimeout(timer)
    }

    const requestId = response.headers.get('x-request-id') ?? undefined
    const text = await response.text()
    const contentType = response.headers.get('content-type') ?? ''
    const trimmed = text.trimStart()
    const looksJson =
      contentType.includes('application/json') ||
      (trimmed.length > 0 && (trimmed.startsWith('{') || trimmed.startsWith('[')))
    const parsed: unknown = looksJson
      ? (() => {
          try {
            return JSON.parse(text) as unknown
          } catch {
            return text
          }
        })()
      : text

    if (!response.ok) {
      const { message, detailCode } = extractErrorMessage(response.status, parsed)
      const status = response.status

      if (status === 429) {
        const retryAfterHeader = response.headers.get('retry-after')
        const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 1
        throw new KsefRateLimitError(
          message,
          Number.isFinite(retryAfter) ? retryAfter : 1,
          requestId,
          { url, payload: parsed },
        )
      }

      if (status === 401 || status === 403) {
        throw new KsefAuthError(message, status, requestId, detailCode, {
          url,
          payload: parsed,
        })
      }

      throw new KsefApiError(message, status, requestId, detailCode, {
        url,
        payload: parsed,
      })
    }

    if (options.responseType === 'text') {
      return text as unknown as T
    }
    return parsed as T
  }
}
