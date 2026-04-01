import type { Invoice } from '@ksefnik/shared'
import type { ValidationRule, ValidationResult, ValidationContext } from './rule.js'

export interface ValidationReport {
  invoice: Invoice
  results: ValidationResult[]
  valid: boolean
}

export function validateInvoice(
  invoice: Invoice,
  rules: ValidationRule[],
  context?: ValidationContext,
): ValidationReport {
  const results: ValidationResult[] = []

  for (const rule of rules) {
    results.push(...rule.validate(invoice, context))
  }

  return {
    invoice,
    results,
    valid: results.every((r) => r.valid),
  }
}

export function validateInvoices(
  invoices: Invoice[],
  rules: ValidationRule[],
): ValidationReport[] {
  const context: ValidationContext = {
    allInvoices: invoices,
    now: new Date(),
  }

  return invoices.map((inv) => validateInvoice(inv, rules, context))
}
