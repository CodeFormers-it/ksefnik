import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'
import { isValidNIP } from '@ksefnik/shared'

export const nipFormatRule: ValidationRule = {
  name: 'nip-format',
  validate(invoice: Invoice): ValidationResult[] {
    return [{
      valid: isValidNIP(invoice.sellerNIP),
      rule: 'nip-format',
      field: 'sellerNIP',
      message: !isValidNIP(invoice.sellerNIP) ? 'Invalid seller NIP checksum' : undefined,
      value: invoice.sellerNIP,
    }]
  },
}
