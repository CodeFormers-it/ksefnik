import { KsefApiError, KsefTimeoutError } from '@ksefnik/shared'

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}

function isRetryable(error: unknown): boolean {
  if (error instanceof KsefTimeoutError) return true
  if (error instanceof KsefApiError) {
    const code = error.statusCode
    return code === 429 || (code !== undefined && code >= 500 && code <= 503)
  }
  if (error instanceof TypeError && error.message.includes('fetch')) return true
  return false
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions,
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...opts }

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error
      }
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
      const jitter = Math.random() * baseDelay * 0.1
      const waitMs = Math.min(exponentialDelay + jitter, maxDelay)
      await delay(waitMs)
    }
  }
  throw lastError
}
