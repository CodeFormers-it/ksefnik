import { constants, createPublicKey, publicEncrypt } from 'node:crypto'

/**
 * Encrypts a payload with RSA-OAEP SHA-256 using the MF public key.
 *
 * Accepts either:
 *  - a `-----BEGIN PUBLIC KEY-----` PEM (SubjectPublicKeyInfo), or
 *  - a `-----BEGIN CERTIFICATE-----` PEM (X.509 certificate, as returned by
 *    KSeF 2.0 `GET /security/public-key-certificates`).
 *
 * `node:crypto.createPublicKey` transparently handles both.
 */
export function rsaOaepEncrypt(
  plaintext: string | Uint8Array,
  publicKeyPemOrCert: string,
): string {
  const key = createPublicKey(publicKeyPemOrCert)
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : Buffer.from(plaintext)
  const encrypted = publicEncrypt(
    { key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    data,
  )
  return encrypted.toString('base64')
}

/**
 * Builds the KSeF 2.0 encryptedToken payload for `POST /auth/ksef-token`.
 *
 * Format: RSA-OAEP(SHA-256) over the UTF-8 bytes of `"{ksefToken}|{timestampMs}"`,
 * base64-encoded. `timestampMs` MUST be the integer from `timestampMs` field
 * of the `/auth/challenge` response (Unix epoch milliseconds), passed as a
 * decimal string. Using the sibling `timestamp` ISO string is rejected by
 * the server (verified against `api.ksef.mf.gov.pl/v2` 2026-04-11).
 */
export function buildEncryptedToken(
  ksefToken: string,
  timestampMs: string,
  publicKeyPemOrCert: string,
): string {
  return rsaOaepEncrypt(`${ksefToken}|${timestampMs}`, publicKeyPemOrCert)
}
