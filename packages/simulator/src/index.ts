import type { SimulatorConfig } from './types.js'
import { MockKsefAdapter } from './adapter.js'
import { InvoiceStore } from './invoice-store.js'
import { getScenarioHooks } from './scenarios/index.js'

export { MockKsefAdapter } from './adapter.js'
export { InvoiceStore } from './invoice-store.js'
export type { SimulatorConfig, ScenarioName } from './types.js'
export type { ScenarioHooks } from './adapter.js'

export function createKsefSimulator(config: SimulatorConfig) {
  const store = new InvoiceStore()
  if (config.invoices) store.seed(config.invoices)

  const hooks = getScenarioHooks(config.scenario)
  const adapter = new MockKsefAdapter(store, hooks)

  return { adapter, store }
}
