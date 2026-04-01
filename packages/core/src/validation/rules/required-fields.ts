import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const requiredFieldsRule: ValidationRule = {
  name: 'required-fields',
  validate(invoice: Invoice): ValidationResult[] {
    const results: ValidationResult[] = []
    const required: (keyof Invoice)[] = ['invoiceNumber', 'sellerNIP', 'grossAmount', 'issueDate']

    for (const field of required) {
      const value = invoice[field]
      results.push({
        valid: value !== undefined && value !== null && value !== '',
        rule: 'required-fields',
        field,
        message: value === undefined || value === null || value === '' ? `Missing required field: ${field}` : undefined,
      })
    }

    return results
  },
}
