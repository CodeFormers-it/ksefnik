import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const invoiceNumberFormatRule: ValidationRule = {
  name: 'invoice-number-format',
  validate(invoice: Invoice): ValidationResult[] {
    const valid = invoice.invoiceNumber.length >= 1 && invoice.invoiceNumber.length <= 256
    return [{
      valid,
      rule: 'invoice-number-format',
      field: 'invoiceNumber',
      message: !valid ? 'Invoice number must be 1-256 characters' : undefined,
      value: invoice.invoiceNumber,
    }]
  },
}
