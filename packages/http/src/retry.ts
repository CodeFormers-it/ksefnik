import { KsefApiError, KsefRateLimitError } from './errors.js'

export interface HttpRetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  maxRetryAfterMs?: number
}

const DEFAULTS: Required<HttpRetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
  maxRetryAfterMs: 30_000,
}

function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) return true
  if (status === 429) return true
  return status >= 500 && status <= 599
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry wrapper that honours `Retry-After` on rate-limit errors.
 *
 * - `KsefRateLimitError` (HTTP 429): waits `retryAfter * 1000` ms, clamped
 *   to `maxRetryAfterMs`. This is critical for `/invoices/query/metadata`
 *   (8 req/s, 16 req/min) where fixed exponential backoff would burst
 *   straight back into another 429.
 * - `KsefApiError` 5xx or undefined status (network error): exponential
 *   backoff with jitter.
 * - Anything else (4xx except 429, unknown errors): thrown immediately.
 */
export async function withHttpRetry<T>(
  fn: () => Promise<T>,
  opts?: HttpRetryOptions,
): Promise<T> {
  const cfg = { ...DEFAULTS, ...opts }
  let lastError: unknown

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isLastAttempt = attempt === cfg.maxAttempts

      if (error instanceof KsefRateLimitError) {
        if (isLastAttempt) throw error
        const waitMs = Math.min(error.retryAfter * 1000, cfg.maxRetryAfterMs)
        await sleep(Math.max(waitMs, cfg.baseDelayMs))
        continue
      }

      if (error instanceof KsefApiError) {
        if (!isRetryableStatus(error.statusCode) || isLastAttempt) throw error
        const expo = cfg.baseDelayMs * Math.pow(2, attempt - 1)
        const jitter = Math.random() * cfg.baseDelayMs * 0.1
        await sleep(Math.min(expo + jitter, cfg.maxDelayMs))
        continue
      }

      throw error
    }
  }
  throw lastError
}
