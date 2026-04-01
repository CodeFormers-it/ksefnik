import type { Invoice } from '@ksefnik/shared'

export interface ValidationResult {
  valid: boolean
  rule: string
  field?: string
  message?: string
  value?: unknown
}

export interface ValidationRule {
  name: string
  validate(invoice: Invoice, context?: ValidationContext): ValidationResult[]
}

export interface ValidationContext {
  allInvoices?: Invoice[]
  now?: Date
}
