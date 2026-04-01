import type {
  KsefnikConfig,
  KsefAdapter,
  Invoice,
  BankTransaction,
  ReconciliationReport,
  FetchInvoicesOpts,
  SendInvoiceInput,
  SendInvoiceResult,
  UpoResult,
  KsefPlugin,
  Storage,
} from '@ksefnik/shared'
import { InMemoryStorage } from './storage/index.js'
import { importBankStatementFromString } from './bank/index.js'
import { runPipeline } from './matching/pipeline.js'
import { validateInvoices } from './validation/engine.js'
import { allRules } from './validation/rules/index.js'
import { PluginRegistry } from './plugins/registry.js'
import { loadPlugin } from './plugins/loader.js'
import type { ImportBankStatementOpts } from './bank/index.js'
import type { ValidationReport } from './validation/engine.js'

export interface CreateKsefnikOpts {
  config: KsefnikConfig
  adapter?: KsefAdapter
  storage?: Storage
}

class InvoiceNamespace {
  constructor(
    private adapter: KsefAdapter | undefined,
    private storage: Storage,
  ) {}

  async fetch(opts: FetchInvoicesOpts): Promise<Invoice[]> {
    if (!this.adapter) throw new Error('No KSeF adapter configured')
    const invoices = await this.adapter.fetchInvoices(opts)
    await this.storage.saveInvoices(invoices)
    return invoices
  }

  async send(input: SendInvoiceInput): Promise<SendInvoiceResult> {
    if (!this.adapter) throw new Error('No KSeF adapter configured')
    return this.adapter.sendInvoice(input)
  }

  async getUpo(ksefReference: string): Promise<UpoResult> {
    if (!this.adapter) throw new Error('No KSeF adapter configured')
    return this.adapter.getUpo(ksefReference)
  }

  async list(): Promise<Invoice[]> {
    return this.storage.getInvoices()
  }
}

class BankNamespace {
  constructor(private storage: Storage) {}

  async importFromString(content: string, opts?: ImportBankStatementOpts): Promise<BankTransaction[]> {
    const transactions = await importBankStatementFromString(content, opts)
    await this.storage.saveTransactions(transactions)
    return transactions
  }

  async list(): Promise<BankTransaction[]> {
    return this.storage.getTransactions()
  }
}

class ReconciliationNamespace {
  constructor(private registry: PluginRegistry) {}

  async run(invoices: Invoice[], transactions: BankTransaction[]): Promise<ReconciliationReport> {
    const passes = this.registry.getPasses()
    return runPipeline(invoices, transactions, passes)
  }
}

class ValidationNamespace {
  validate(invoices: Invoice[]): ValidationReport[] {
    return validateInvoices(invoices, allRules)
  }
}

class PluginsNamespace {
  constructor(private registry: PluginRegistry) {}

  register(plugin: KsefPlugin): void {
    this.registry.register(plugin)
  }

  async load(name: string): Promise<KsefPlugin | null> {
    const plugin = await loadPlugin(name)
    if (plugin) this.registry.register(plugin)
    return plugin
  }

  list(): KsefPlugin[] {
    return this.registry.list()
  }
}

export class Ksefnik {
  readonly invoices: InvoiceNamespace
  readonly bank: BankNamespace
  readonly reconciliation: ReconciliationNamespace
  readonly validation: ValidationNamespace
  readonly plugins: PluginsNamespace
  readonly storage: Storage

  constructor(opts: CreateKsefnikOpts) {
    const storage = opts.storage ?? new InMemoryStorage()
    const registry = new PluginRegistry()

    this.storage = storage
    this.invoices = new InvoiceNamespace(opts.adapter, storage)
    this.bank = new BankNamespace(storage)
    this.reconciliation = new ReconciliationNamespace(registry)
    this.validation = new ValidationNamespace()
    this.plugins = new PluginsNamespace(registry)
  }
}

export function createKsefnik(opts: CreateKsefnikOpts): Ksefnik {
  return new Ksefnik(opts)
}
