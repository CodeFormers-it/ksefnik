import { KsefnikError } from './base.js'

export class InvoiceValidationError extends KsefnikError {
  constructor(
    public readonly rule: string,
    public readonly field: string,
    public readonly value: unknown,
    message?: string,
  ) {
    super('VALIDATION_INVOICE', message ?? `Validation failed: rule "${rule}" on field "${field}"`, {
      rule,
      field,
      value,
    })
    this.name = 'InvoiceValidationError'
  }
}
