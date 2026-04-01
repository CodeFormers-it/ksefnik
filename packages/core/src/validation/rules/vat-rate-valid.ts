import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

const VALID_VAT_RATES = new Set([0, 5, 8, 23])

export const vatRateValidRule: ValidationRule = {
  name: 'vat-rate-valid',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.lineItems?.length) return [{ valid: true, rule: 'vat-rate-valid' }]

    const results: ValidationResult[] = []
    for (const item of invoice.lineItems) {
      if (item.vatRate === undefined) continue
      results.push({
        valid: VALID_VAT_RATES.has(item.vatRate),
        rule: 'vat-rate-valid',
        field: `lineItems[${item.lineNumber}].vatRate`,
        message: !VALID_VAT_RATES.has(item.vatRate) ? `Invalid VAT rate: ${item.vatRate}%` : undefined,
        value: item.vatRate,
      })
    }

    return results.length > 0 ? results : [{ valid: true, rule: 'vat-rate-valid' }]
  },
}
