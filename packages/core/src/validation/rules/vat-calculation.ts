import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const vatCalculationRule: ValidationRule = {
  name: 'vat-calculation',
  validate(invoice: Invoice): ValidationResult[] {
    if (invoice.netAmount === undefined || invoice.vatAmount === undefined) {
      return [{ valid: true, rule: 'vat-calculation' }]
    }

    const expected = invoice.grossAmount - invoice.netAmount
    const diff = Math.abs(expected - invoice.vatAmount)
    // 1 grosz tolerance
    const valid = diff <= 1

    return [{
      valid,
      rule: 'vat-calculation',
      field: 'vatAmount',
      message: !valid ? `VAT mismatch: gross(${invoice.grossAmount}) - net(${invoice.netAmount}) = ${expected}, but vatAmount = ${invoice.vatAmount}` : undefined,
    }]
  },
}
