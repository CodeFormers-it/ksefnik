import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const amountPositiveRule: ValidationRule = {
  name: 'amount-positive',
  validate(invoice: Invoice): ValidationResult[] {
    return [{
      valid: invoice.grossAmount > 0,
      rule: 'amount-positive',
      field: 'grossAmount',
      message: invoice.grossAmount <= 0 ? 'Gross amount must be positive' : undefined,
      value: invoice.grossAmount,
    }]
  },
}
