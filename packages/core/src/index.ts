// Facade
export { Ksefnik, createKsefnik } from './ksefnik.js'
export type { CreateKsefnikOpts } from './ksefnik.js'

// Storage
export { InMemoryStorage, SqliteStorage } from './storage/index.js'

// KSeF Adapter
export { KsefAdapterImpl } from './ksef/index.js'
export { withRetry } from './ksef/index.js'
export { TtlCache, cacheKey } from './ksef/index.js'
export { SessionManager } from './ksef/index.js'
export type { KsefClient, KsefClientConfig, KsefSessionState, KsefRawInvoice } from './ksef/index.js'
export type { RetryOptions } from './ksef/index.js'
export type { SessionManagerOptions } from './ksef/index.js'

// Bank Parsers
export {
  importBankStatement,
  importBankStatementFromString,
  extractNIPs,
  extractFirstNIP,
  detectBankFormat,
  Mt940Parser,
  MbankParser,
  IngParser,
  PkoParser,
  SantanderParser,
  getDefaultParsers,
} from './bank/index.js'

// Validation
export { validateInvoice, validateInvoices, allRules } from './validation/index.js'
export type { ValidationRule, ValidationResult, ValidationContext, ValidationReport } from './validation/index.js'

// Reconciliation
export { runPipeline, defaultPasses } from './matching/index.js'

// Plugins
export { PluginRegistry, loadPlugin } from './plugins/index.js'
