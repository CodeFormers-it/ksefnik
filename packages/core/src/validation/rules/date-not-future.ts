import type { ValidationRule, ValidationResult, ValidationContext } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const dateNotFutureRule: ValidationRule = {
  name: 'date-not-future',
  validate(invoice: Invoice, context?: ValidationContext): ValidationResult[] {
    const now = context?.now ?? new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const valid = invoice.issueDate <= tomorrowStr
    return [{
      valid,
      rule: 'date-not-future',
      field: 'issueDate',
      message: !valid ? 'Issue date cannot be in the future' : undefined,
      value: invoice.issueDate,
    }]
  },
}
