import type { KsefRawInvoice } from '@ksefnik/core'

export interface KsefRawInvoiceExt extends KsefRawInvoice {
  grossAmountGrosze?: number
  currency?: string
  buyerNip?: string
  buyerName?: string
}
