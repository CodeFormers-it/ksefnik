import type { ValidationRule, ValidationResult, ValidationContext } from '../rule.js'
import type { Invoice } from '@ksefnik/shared'

export const duplicateCheckRule: ValidationRule = {
  name: 'duplicate-check',
  validate(invoice: Invoice, context?: ValidationContext): ValidationResult[] {
    if (!context?.allInvoices) return [{ valid: true, rule: 'duplicate-check' }]

    const duplicates = context.allInvoices.filter(
      (i) =>
        i.id !== invoice.id &&
        i.invoiceNumber === invoice.invoiceNumber &&
        i.sellerNIP === invoice.sellerNIP,
    )

    return [{
      valid: duplicates.length === 0,
      rule: 'duplicate-check',
      field: 'invoiceNumber',
      message: duplicates.length > 0 ? `Duplicate invoice: ${invoice.invoiceNumber} from ${invoice.sellerNIP}` : undefined,
    }]
  },
}
