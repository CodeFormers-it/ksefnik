import { readFileSync } from 'node:fs'
import type { KsefAdapter, KsefnikConfig } from '@ksefnik/shared'
import { createHttpAdapter } from '@ksefnik/http'
import { createKsefSimulator } from '@ksefnik/simulator'

export type CliAdapterKind = 'http' | 'simulator'

export interface CliGlobalOpts {
  nip?: string
  env?: 'production' | 'demo' | 'test'
  token?: string
  adapter?: CliAdapterKind
  publicKey?: string
  debug?: boolean
}

export function resolveConfig(opts: CliGlobalOpts): KsefnikConfig {
  return {
    nip: opts.nip ?? process.env['KSEFNIK_NIP'] ?? '',
    environment: opts.env ?? (process.env['KSEFNIK_ENV'] as KsefnikConfig['environment']) ?? 'test',
    token: opts.token ?? process.env['KSEFNIK_TOKEN'],
  }
}

function resolvePublicKey(opts: CliGlobalOpts): string | undefined {
  const cliValue = opts.publicKey
  if (cliValue && cliValue.includes('-----BEGIN PUBLIC KEY-----')) return cliValue
  if (cliValue && cliValue.length > 0) return readFileSync(cliValue, 'utf8')

  const envInline = process.env['KSEFNIK_PUBLIC_KEY_PEM']
  if (envInline && envInline.includes('-----BEGIN PUBLIC KEY-----')) return envInline

  const envPath = process.env['KSEFNIK_PUBLIC_KEY_PATH']
  if (envPath && envPath.length > 0) return readFileSync(envPath, 'utf8')

  return undefined
}

export function resolveAdapter(opts: CliGlobalOpts, config: KsefnikConfig): KsefAdapter {
  const kind: CliAdapterKind =
    opts.adapter ?? ((process.env['KSEFNIK_ADAPTER'] as CliAdapterKind | undefined) ?? 'http')

  if (kind === 'simulator') {
    return createKsefSimulator({ scenario: 'happy-path' }).adapter
  }

  if (!config.token) {
    throw new Error('HTTP adapter requires KSeF token (--token or KSEFNIK_TOKEN).')
  }
  if (!config.nip) {
    throw new Error('HTTP adapter requires NIP (--nip or KSEFNIK_NIP).')
  }

  return createHttpAdapter({
    nip: config.nip,
    token: config.token,
    environment: config.environment,
    publicKeyPem: resolvePublicKey(opts),
  })
}
