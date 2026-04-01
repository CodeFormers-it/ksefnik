import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const lineItemsSumRule: ValidationRule = {
  name: 'line-items-sum',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.lineItems?.length || invoice.netAmount === undefined) {
      return [{ valid: true, rule: 'line-items-sum' }]
    }

    const sum = invoice.lineItems.reduce((acc, item) => acc + item.netAmount, 0)
    const valid = sum === invoice.netAmount

    return [{
      valid,
      rule: 'line-items-sum',
      field: 'lineItems',
      message: !valid ? `Line items net sum (${sum}) != netAmount (${invoice.netAmount})` : undefined,
    }]
  },
}
