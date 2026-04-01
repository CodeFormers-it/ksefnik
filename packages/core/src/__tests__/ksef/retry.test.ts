import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../../ksef/retry.js'
import { KsefApiError, KsefTimeoutError } from '@ksefnik/shared'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on KsefTimeoutError and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new KsefTimeoutError('timeout'))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on HTTP 429', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new KsefApiError('rate limit', 429))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on HTTP 500', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new KsefApiError('server error', 500))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 10 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry on HTTP 400', async () => {
    const fn = vi.fn().mockRejectedValue(new KsefApiError('bad request', 400))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow('bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry on HTTP 403', async () => {
    const fn = vi.fn().mockRejectedValue(new KsefApiError('forbidden', 403))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow('forbidden')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new KsefTimeoutError('timeout'))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow('timeout')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('unknown'))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow('unknown')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('uses default options', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await withRetry(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
