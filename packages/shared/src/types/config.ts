export interface KsefnikConfig {
  nip: string
  environment: 'production' | 'demo' | 'test'
  token?: string
  storage?: 'memory' | 'sqlite'
  sqlitePath?: string
  plugins?: string[]
  reconciliation?: {
    minConfidence?: number
    enabledPasses?: string[]
  }
}
