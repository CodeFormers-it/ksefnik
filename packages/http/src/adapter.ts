import { KsefAdapterImpl } from '@ksefnik/core'
import type { KsefAdapter } from '@ksefnik/shared'

import { KsefHttpClient, type KsefHttpClientOptions } from './client.js'
import type { KsefEnvironment } from './endpoints.js'

export interface CreateHttpAdapterOpts {
  nip: string
  token: string
  environment: KsefEnvironment
  /**
   * Optional pinned MF RSA public key (PEM/SPKI). When omitted, the client
   * fetches it from `GET /security/public-key-certificates` on first session.
   */
  publicKeyPem?: string
  client?: Partial<Omit<KsefHttpClientOptions, 'environment' | 'publicKeyPem'>>
}

export function createHttpAdapter(opts: CreateHttpAdapterOpts): KsefAdapter {
  if (!opts.nip) throw new Error('createHttpAdapter: nip is required')
  if (!opts.token) throw new Error('createHttpAdapter: token is required')

  const client = new KsefHttpClient({
    environment: opts.environment,
    publicKeyPem: opts.publicKeyPem,
    ...opts.client,
  })
  return new KsefAdapterImpl(client, {
    nip: opts.nip,
    environment: opts.environment,
    token: opts.token,
  })
}
