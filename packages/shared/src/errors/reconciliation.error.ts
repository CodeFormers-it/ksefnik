import { KsefnikError } from './base.js'

export class ReconciliationError extends KsefnikError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('RECONCILIATION_ERROR', message, context)
    this.name = 'ReconciliationError'
  }
}
