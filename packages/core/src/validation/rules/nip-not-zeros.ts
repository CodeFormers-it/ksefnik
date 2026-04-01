import type { ValidationRule, ValidationResult } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const nipNotZerosRule: ValidationRule = {
  name: 'nip-not-zeros',
  validate(invoice: Invoice): ValidationResult[] {
    return [{
      valid: invoice.sellerNIP !== '0000000000',
      rule: 'nip-not-zeros',
      field: 'sellerNIP',
      message: invoice.sellerNIP === '0000000000' ? 'NIP cannot be all zeros' : undefined,
    }]
  },
}
