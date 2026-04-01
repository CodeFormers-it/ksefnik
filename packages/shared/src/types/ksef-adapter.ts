import type { Invoice } from '../schemas/index.js'

export interface FetchInvoicesOpts {
  from: string
  to: string
  nip?: string
  pageSize?: number
  pageOffset?: number
}

export interface SendInvoiceInput {
  xml: string
  nip: string
}

export interface SendInvoiceResult {
  ksefReference: string
  timestamp: string
}

export interface UpoResult {
  ksefReference: string
  upoXml: string
  status: 'confirmed' | 'pending' | 'rejected'
}

export interface KsefAdapter {
  fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]>
  sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult>
  getUpo(ksefReference: string): Promise<UpoResult>
}
