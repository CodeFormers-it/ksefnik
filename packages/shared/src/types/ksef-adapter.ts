import type { Invoice } from '../schemas/index.js'

export type InvoiceSubjectType = 'Subject1' | 'Subject2' | 'Subject3'

export interface FetchInvoicesOpts {
  from: string
  to: string
  nip?: string
  /**
   * Role of the queried NIP in the invoice. `Subject1` = issuer (sales invoices,
   * where the company sold), `Subject2` = buyer (cost invoices, where the
   * company bought). Defaults to `Subject2` for backwards compatibility.
   */
  subjectType?: InvoiceSubjectType
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
  initSession?(): Promise<void>
  closeSession?(): Promise<void>
}
