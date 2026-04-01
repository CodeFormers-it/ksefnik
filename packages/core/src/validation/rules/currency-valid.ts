import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const currencyValidRule: ValidationRule = {
  name: 'currency-valid',
  validate(invoice: Invoice): ValidationResult[] {
    return [{
      valid: invoice.currency === 'PLN',
      rule: 'currency-valid',
      field: 'currency',
      message: invoice.currency !== 'PLN' ? `Unsupported currency: ${invoice.currency}` : undefined,
      value: invoice.currency,
    }]
  },
}
