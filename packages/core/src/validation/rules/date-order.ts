import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const dateOrderRule: ValidationRule = {
  name: 'date-order',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.dueDate) return [{ valid: true, rule: 'date-order' }]
    const valid = invoice.dueDate >= invoice.issueDate
    return [{
      valid,
      rule: 'date-order',
      field: 'dueDate',
      message: !valid ? 'Due date must be on or after issue date' : undefined,
    }]
  },
}
