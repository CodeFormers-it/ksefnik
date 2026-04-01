import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const sellerBuyerDifferentRule: ValidationRule = {
  name: 'seller-buyer-different',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.buyerNIP) return [{ valid: true, rule: 'seller-buyer-different' }]
    const valid = invoice.sellerNIP !== invoice.buyerNIP
    return [{
      valid,
      rule: 'seller-buyer-different',
      field: 'buyerNIP',
      message: !valid ? 'Seller and buyer NIP must be different' : undefined,
    }]
  },
}
