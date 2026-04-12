import { PATHS } from './endpoints.js'
import { KsefApiError } from './errors.js'
import type { HttpClient } from './http.js'
import type { KsefPublicKeyCertificate } from './generated/index.js'

export type PublicKeyCertificate = KsefPublicKeyCertificate

function base64ToCertPem(base64: string): string {
  const normalized = base64.replace(/\s+/g, '')
  const chunks = normalized.match(/.{1,64}/g) ?? [normalized]
  return `-----BEGIN CERTIFICATE-----\n${chunks.join('\n')}\n-----END CERTIFICATE-----\n`
}

function isActive(cert: PublicKeyCertificate, now: Date = new Date()): boolean {
  const from = new Date(cert.validFrom)
  const to = new Date(cert.validTo)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false
  return from <= now && now <= to
}

export async function fetchPublicKeyCertificates(
  http: HttpClient,
): Promise<PublicKeyCertificate[]> {
  const response = await http.request<PublicKeyCertificate[] | { items?: PublicKeyCertificate[] }>(
    {
      method: 'GET',
      path: PATHS.publicKeyCertificates,
    },
  )
  if (Array.isArray(response)) return response
  return response.items ?? []
}

export async function fetchKsefTokenEncryptionKey(http: HttpClient): Promise<string> {
  const certs = await fetchPublicKeyCertificates(http)
  if (certs.length === 0) {
    throw new KsefApiError(
      'KSeF public-key-certificates endpoint returned no certificates',
      undefined,
      undefined,
      'NO_PUBLIC_KEY',
    )
  }

  const now = new Date()
  const candidate =
    certs.find((c) => c.usage.includes('KsefTokenEncryption') && isActive(c, now)) ??
    certs.find((c) => c.usage.includes('KsefTokenEncryption'))

  if (!candidate) {
    throw new KsefApiError(
      'No KsefTokenEncryption certificate available from KSeF public-key-certificates endpoint',
      undefined,
      undefined,
      'NO_TOKEN_ENCRYPTION_KEY',
    )
  }

  return base64ToCertPem(candidate.certificate)
}
