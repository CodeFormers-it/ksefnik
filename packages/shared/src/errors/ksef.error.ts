import { KsefnikError } from './base.js'

export class KsefApiError extends KsefnikError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    context?: Record<string, unknown>,
  ) {
    super('KSEF_API_ERROR', message, context)
    this.name = 'KsefApiError'
  }
}

export class KsefSessionError extends KsefnikError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('KSEF_SESSION_ERROR', message, context)
    this.name = 'KsefSessionError'
  }
}

export class KsefTimeoutError extends KsefnikError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('KSEF_TIMEOUT_ERROR', message, context)
    this.name = 'KsefTimeoutError'
  }
}
