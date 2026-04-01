import type { KsefnikConfig } from '@ksefnik/shared'

export interface CliGlobalOpts {
  nip?: string
  env?: 'production' | 'demo' | 'test'
  token?: string
  debug?: boolean
}

export function resolveConfig(opts: CliGlobalOpts): KsefnikConfig {
  return {
    nip: opts.nip ?? process.env['KSEFNIK_NIP'] ?? '',
    environment: opts.env ?? (process.env['KSEFNIK_ENV'] as KsefnikConfig['environment']) ?? 'test',
    token: opts.token ?? process.env['KSEFNIK_TOKEN'],
  }
}
