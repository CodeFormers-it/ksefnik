import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

const MAX_AMOUNT = 99_999_999_99 // 999,999.99 PLN in grosze

export const amountMaxRule: ValidationRule = {
  name: 'amount-max',
  validate(invoice: Invoice): ValidationResult[] {
    return [{
      valid: invoice.grossAmount <= MAX_AMOUNT,
      rule: 'amount-max',
      field: 'grossAmount',
      message: invoice.grossAmount > MAX_AMOUNT ? 'Gross amount exceeds maximum (999,999.99 PLN)' : undefined,
      value: invoice.grossAmount,
    }]
  },
}
