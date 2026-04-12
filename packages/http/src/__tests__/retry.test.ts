import { describe, expect, it } from 'vitest'
import { withHttpRetry } from '../retry.js'
import { KsefApiError, KsefAuthError, KsefRateLimitError } from '../errors.js'

describe('withHttpRetry', () => {
  it('honours Retry-After on 429 (does not use fixed exponential backoff)', async () => {
    let attempts = 0
    const start = Date.now()
    const result = await withHttpRetry(
      async () => {
        attempts++
        if (attempts === 1) {
          throw new KsefRateLimitError('rate limit', 1)
        }
        return 'ok'
      },
      { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 20, maxRetryAfterMs: 1500 },
    )
    const elapsed = Date.now() - start
    expect(result).toBe('ok')
    expect(attempts).toBe(2)
    expect(elapsed).toBeGreaterThanOrEqual(900)
  })

  it('retries 5xx with exponential backoff', async () => {
    let attempts = 0
    const result = await withHttpRetry(
      async () => {
        attempts++
        if (attempts < 3) throw new KsefApiError('boom', 503)
        return 'ok'
      },
      { maxAttempts: 5, baseDelayMs: 1, maxDelayMs: 5 },
    )
    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('does NOT retry KsefAuthError (401/403)', async () => {
    let attempts = 0
    await expect(
      withHttpRetry(
        async () => {
          attempts++
          throw new KsefAuthError('unauthorized', 401)
        },
        { maxAttempts: 3, baseDelayMs: 1 },
      ),
    ).rejects.toThrow(KsefAuthError)
    expect(attempts).toBe(1)
  })

  it('does NOT retry KsefApiError 4xx (non-429)', async () => {
    let attempts = 0
    await expect(
      withHttpRetry(
        async () => {
          attempts++
          throw new KsefApiError('bad request', 400)
        },
        { maxAttempts: 3, baseDelayMs: 1 },
      ),
    ).rejects.toThrow(KsefApiError)
    expect(attempts).toBe(1)
  })

  it('gives up after maxAttempts', async () => {
    let attempts = 0
    await expect(
      withHttpRetry(
        async () => {
          attempts++
          throw new KsefApiError('boom', 500)
        },
        { maxAttempts: 2, baseDelayMs: 1 },
      ),
    ).rejects.toThrow(KsefApiError)
    expect(attempts).toBe(2)
  })

  it('clamps absurd Retry-After values to maxRetryAfterMs', async () => {
    let attempts = 0
    const start = Date.now()
    await withHttpRetry(
      async () => {
        attempts++
        if (attempts === 1) throw new KsefRateLimitError('rate', 3600)
        return 'ok'
      },
      { maxAttempts: 2, baseDelayMs: 1, maxRetryAfterMs: 50 },
    )
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(200)
  })
})
