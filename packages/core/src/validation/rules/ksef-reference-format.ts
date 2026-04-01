import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

// KSeF reference pattern: digits-date-alphanumeric
const KSEF_REF_PATTERN = /^\d+-\d{8}-[A-Z0-9]+$/

export const ksefReferenceFormatRule: ValidationRule = {
  name: 'ksef-reference-format',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.ksefReference) return [{ valid: true, rule: 'ksef-reference-format' }]
    const valid = KSEF_REF_PATTERN.test(invoice.ksefReference)
    return [{
      valid,
      rule: 'ksef-reference-format',
      field: 'ksefReference',
      message: !valid ? `Invalid KSeF reference format: ${invoice.ksefReference}` : undefined,
      value: invoice.ksefReference,
    }]
  },
}
