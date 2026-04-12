export interface KsefSessionState {
  token: string
  nip: string
  environment: 'production' | 'demo' | 'test'
  expiresAt: Date
  referenceNumber: string
}

export interface KsefClientConfig {
  nip: string
  environment: 'production' | 'demo' | 'test'
  token: string
}

export type KsefSubjectType = 'Subject1' | 'Subject2' | 'Subject3'

export interface KsefRawInvoice {
  ksefReferenceNumber: string
  invoiceNumber: string
  subjectNip: string
  subjectName?: string
  invoicingDate: string
  xml: string
  grossAmountGrosze?: number
  currency?: string
  buyerNip?: string
  buyerName?: string
}

export interface KsefClient {
  initSession(config: KsefClientConfig): Promise<KsefSessionState>
  terminateSession(token: string): Promise<void>
  fetchInvoices(params: {
    token: string
    dateFrom: string
    dateTo: string
    subjectNip?: string
    subjectType?: KsefSubjectType
    pageSize?: number
    pageOffset?: number
  }): Promise<{ invoices: KsefRawInvoice[]; total: number }>
  sendInvoice(params: {
    token: string
    xml: string
  }): Promise<{ ksefReferenceNumber: string; timestamp: string }>
  getUpo(params: {
    token: string
    ksefReferenceNumber: string
  }): Promise<{ xml: string; status: 'confirmed' | 'pending' | 'rejected' }>
}
