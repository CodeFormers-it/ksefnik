import type { ValidationRule, ValidationResult, ValidationContext } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000

export const dateRangeRule: ValidationRule = {
  name: 'date-range',
  validate(invoice: Invoice, context?: ValidationContext): ValidationResult[] {
    const now = context?.now ?? new Date()
    const issueDate = new Date(invoice.issueDate)
    const age = now.getTime() - issueDate.getTime()
    const valid = age <= TEN_YEARS_MS

    return [{
      valid,
      rule: 'date-range',
      field: 'issueDate',
      message: !valid ? 'Invoice is older than 10 years' : undefined,
      value: invoice.issueDate,
    }]
  },
}
