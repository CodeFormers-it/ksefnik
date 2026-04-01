import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const dateValidRule: ValidationRule = {
  name: 'date-valid',
  validate(invoice: Invoice): ValidationResult[] {
    const valid = ISO_DATE.test(invoice.issueDate) && !isNaN(Date.parse(invoice.issueDate))
    return [{
      valid,
      rule: 'date-valid',
      field: 'issueDate',
      message: !valid ? 'Issue date must be a valid ISO date' : undefined,
      value: invoice.issueDate,
    }]
  },
}
