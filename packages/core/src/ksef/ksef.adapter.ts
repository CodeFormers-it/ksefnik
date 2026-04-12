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

  private async ensureSession(): Promise<KsefSessionState> {
    if (!this.session) {
      await this.initSession()
    }
    if (!this.session) {
      throw new Error('KSeF session init returned no session state')
    }
    return this.session
  }

  async fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]> {
    const session = await this.ensureSession()
    const subjectType = opts.subjectType ?? 'Subject2'
    const result = await this.client.fetchInvoices({
      token: session.token,
      dateFrom: opts.from,
      dateTo: opts.to,
      subjectNip: opts.nip,
      subjectType,
      pageSize: opts.pageSize,
      pageOffset: opts.pageOffset,
    })

    return result.invoices.map((raw) => ({
      id: crypto.randomUUID(),
      invoiceNumber: raw.invoiceNumber,
      sellerNIP: raw.subjectNip,
      buyerNIP: raw.buyerNip,
      grossAmount: raw.grossAmountGrosze ?? 0,
      currency: 'PLN' as const,
      issueDate: raw.invoicingDate,
      ksefReference: raw.ksefReferenceNumber,
      sellerName: raw.subjectName,
      buyerName: raw.buyerName,
      rawXml: raw.xml,
      createdAt: new Date().toISOString(),
    }))
  }

  async sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult> {
    const session = await this.ensureSession()
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
    const session = await this.ensureSession()
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
