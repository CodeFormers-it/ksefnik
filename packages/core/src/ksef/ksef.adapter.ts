import type {
  KsefAdapter,
  FetchInvoicesOpts,
  SendInvoiceInput,
  SendInvoiceResult,
  UpoResult,
  Invoice,
} from '@ksefnik/shared'
import type { KsefClient, KsefClientConfig, KsefSessionState } from './types.js'

export class KsefAdapterImpl implements KsefAdapter {
  private session: KsefSessionState | null = null

  constructor(
    private readonly client: KsefClient,
    private readonly config: KsefClientConfig,
  ) {}

  async initSession(): Promise<void> {
    this.session = await this.client.initSession(this.config)
  }

  async closeSession(): Promise<void> {
    if (this.session) {
      await this.client.terminateSession(this.session.token)
      this.session = null
    }
  }

  getSession(): KsefSessionState | null {
    return this.session
  }

  private ensureSession(): KsefSessionState {
    if (!this.session) {
      throw new Error('KSeF session not initialized. Call initSession() first.')
    }
    return this.session
  }

  async fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]> {
    const session = this.ensureSession()
    const result = await this.client.fetchInvoices({
      token: session.token,
      dateFrom: opts.from,
      dateTo: opts.to,
      subjectNip: opts.nip,
      pageSize: opts.pageSize,
      pageOffset: opts.pageOffset,
    })

    return result.invoices.map((raw) => ({
      id: crypto.randomUUID(),
      invoiceNumber: raw.invoiceNumber,
      sellerNIP: raw.subjectNip,
      grossAmount: 0, // to be parsed from XML
      currency: 'PLN' as const,
      issueDate: raw.invoicingDate,
      ksefReference: raw.ksefReferenceNumber,
      sellerName: raw.subjectName,
      rawXml: raw.xml,
      createdAt: new Date().toISOString(),
    }))
  }

  async sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult> {
    const session = this.ensureSession()
    const result = await this.client.sendInvoice({
      token: session.token,
      xml: input.xml,
    })

    return {
      ksefReference: result.ksefReferenceNumber,
      timestamp: result.timestamp,
    }
  }

  async getUpo(ksefReference: string): Promise<UpoResult> {
    const session = this.ensureSession()
    const result = await this.client.getUpo({
      token: session.token,
      ksefReferenceNumber: ksefReference,
    })

    return {
      ksefReference,
      upoXml: result.xml,
      status: result.status,
    }
  }
}
