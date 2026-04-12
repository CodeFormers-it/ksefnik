/**
 * Re-exports from the openapi-typescript generated file. Consumers should
 * import named type aliases from here rather than reaching into the raw
 * `components["schemas"][...]` tree.
 *
 * Regenerate with: `pnpm --filter @ksefnik/http generate`
 * Source of truth: https://api.ksef.mf.gov.pl/docs/v2/openapi.json
 */
import type { components } from './ksef-api.js'

type Schemas = components['schemas']

// Auth flow
export type KsefAuthenticationChallengeResponse = Schemas['AuthenticationChallengeResponse']
export type KsefInitTokenAuthenticationRequest = Schemas['InitTokenAuthenticationRequest']
export type KsefAuthenticationInitResponse = Schemas['AuthenticationInitResponse']
export type KsefAuthenticationOperationStatusResponse = Schemas['AuthenticationOperationStatusResponse']
export type KsefAuthenticationTokensResponse = Schemas['AuthenticationTokensResponse']
export type KsefAuthenticationTokenRefreshResponse = Schemas['AuthenticationTokenRefreshResponse']
export type KsefTokenInfo = Schemas['TokenInfo']
export type KsefAuthenticationContextIdentifier = Schemas['AuthenticationContextIdentifier']
export type KsefAuthenticationContextIdentifierType = Schemas['AuthenticationContextIdentifierType']

// Certificates
export type KsefPublicKeyCertificate = Schemas['PublicKeyCertificate']
export type KsefPublicKeyCertificateUsage = Schemas['PublicKeyCertificateUsage']

// Invoice query
export type KsefInvoiceQueryFilters = Schemas['InvoiceQueryFilters']
export type KsefInvoiceQuerySubjectType = Schemas['InvoiceQuerySubjectType']
export type KsefInvoiceQueryDateType = Schemas['InvoiceQueryDateType']
export type KsefQueryInvoicesMetadataResponse = Schemas['QueryInvoicesMetadataResponse']
export type KsefInvoiceMetadata = Schemas['InvoiceMetadata']
export type KsefInvoiceMetadataBuyer = Schemas['InvoiceMetadataBuyer']
export type KsefInvoiceMetadataSeller = Schemas['InvoiceMetadataSeller']

// Generic shared
export type { components, paths, operations } from './ksef-api.js'

