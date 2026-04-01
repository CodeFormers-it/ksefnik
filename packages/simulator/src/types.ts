import type { Invoice } from '@ksefnik/shared'

export type ScenarioName = 'happy-path' | 'timeout' | 'invalid-nip' | 'session-expired' | 'upo-delay'

export interface SimulatorConfig {
  scenario: ScenarioName
  invoices?: Invoice[]
}
