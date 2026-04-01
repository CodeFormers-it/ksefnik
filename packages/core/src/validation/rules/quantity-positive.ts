import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const quantityPositiveRule: ValidationRule = {
  name: 'quantity-positive',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.lineItems?.length) return [{ valid: true, rule: 'quantity-positive' }]

    const results: ValidationResult[] = []
    for (const item of invoice.lineItems) {
      if (item.quantity === undefined) continue
      results.push({
        valid: item.quantity > 0,
        rule: 'quantity-positive',
        field: `lineItems[${item.lineNumber}].quantity`,
        message: item.quantity <= 0 ? `Quantity must be positive: ${item.quantity}` : undefined,
        value: item.quantity,
      })
    }

    return results.length > 0 ? results : [{ valid: true, rule: 'quantity-positive' }]
  },
}
