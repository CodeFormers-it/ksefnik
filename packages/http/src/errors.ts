import { KsefApiError as SharedKsefApiError } from '@ksefnik/shared'

export class KsefApiError extends SharedKsefApiError {
  constructor(
    message: string,
    statusCode?: number,
    public readonly requestId?: string,
    public readonly detailCode?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, statusCode, context)
    this.name = 'KsefApiError'
  }
}

export class KsefAuthError extends KsefApiError {
  constructor(
    message: string,
    statusCode: number,
    requestId?: string,
    detailCode?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, statusCode, requestId, detailCode, context)
    this.name = 'KsefAuthError'
  }
}

export class KsefRateLimitError extends KsefApiError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    requestId?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, 429, requestId, 'RATE_LIMIT', context)
    this.name = 'KsefRateLimitError'
  }
}
