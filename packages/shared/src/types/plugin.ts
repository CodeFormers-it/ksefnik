import type { Invoice, ReconciliationReport } from '../schemas/index.js'
import type { ReconciliationPass } from './reconciliation-pass.js'

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (input: unknown) => Promise<unknown>
}

export interface CliCommand {
  name: string
  description: string
  options?: Record<string, unknown>
  action: (...args: unknown[]) => Promise<void>
}

export interface KsefPlugin {
  name: string
  version: string
  reconciliationPasses?(): ReconciliationPass[]
  onReconciliationComplete?(report: ReconciliationReport): Promise<void>
  onInvoicesSynced?(invoices: Invoice[]): Promise<void>
  mcpTools?(): McpToolDefinition[]
  cliCommands?(): CliCommand[]
}
