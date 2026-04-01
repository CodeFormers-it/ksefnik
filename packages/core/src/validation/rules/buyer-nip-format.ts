import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'
import { isValidNIP } from '@ksefnik/shared'

export const buyerNipFormatRule: ValidationRule = {
  name: 'buyer-nip-format',
  validate(invoice: Invoice): ValidationResult[] {
    if (!invoice.buyerNIP) return [{ valid: true, rule: 'buyer-nip-format' }]
    return [{
      valid: isValidNIP(invoice.buyerNIP),
      rule: 'buyer-nip-format',
      field: 'buyerNIP',
      message: !isValidNIP(invoice.buyerNIP) ? 'Invalid buyer NIP checksum' : undefined,
      value: invoice.buyerNIP,
    }]
  },
}
