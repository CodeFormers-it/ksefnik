import type {
  KsefAdapter,
  FetchInvoicesOpts,
  SendInvoiceInput,
  SendInvoiceResult,
  UpoResult,
  Invoice,
} from '@ksefnik/shared'
import { InvoiceStore } from './invoice-store.js'

export interface ScenarioHooks {
  beforeFetch?(opts: FetchInvoicesOpts): Promise<void>
  beforeSend?(input: SendInvoiceInput): Promise<void>
  beforeGetUpo?(ref: string): Promise<UpoResult | null>
}

export class MockKsefAdapter implements KsefAdapter {
  constructor(
    private store: InvoiceStore,
    private hooks: ScenarioHooks = {},
  ) {}

  async fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]> {
    if (this.hooks.beforeFetch) await this.hooks.beforeFetch(opts)
    return this.store.getByDateRange(opts.from, opts.to)
  }

  async sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult> {
    if (this.hooks.beforeSend) await this.hooks.beforeSend(input)
    const ref = `KSEF-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    return {
      ksefReference: ref,
      timestamp: new Date().toISOString(),
    }
  }

  async getUpo(ksefReference: string): Promise<UpoResult> {
    if (this.hooks.beforeGetUpo) {
      const override = await this.hooks.beforeGetUpo(ksefReference)
      if (override) return override
    }
    return {
      ksefReference,
      upoXml: `<UPO ref="${ksefReference}"/>`,
      status: 'confirmed',
    }
  }
}
