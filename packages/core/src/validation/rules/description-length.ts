import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

const MAX_LENGTH = 256

export const descriptionLengthRule: ValidationRule = {
  name: 'description-length',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.lineItems?.length) return [{ valid: true, rule: 'description-length' }]

    const results: ValidationResult[] = []
    for (const item of invoice.lineItems) {
      results.push({
        valid: item.description.length <= MAX_LENGTH,
        rule: 'description-length',
        field: `lineItems[${item.lineNumber}].description`,
        message: item.description.length > MAX_LENGTH ? `Description exceeds ${MAX_LENGTH} characters` : undefined,
      })
    }

    return results.length > 0 ? results : [{ valid: true, rule: 'description-length' }]
  },
}
