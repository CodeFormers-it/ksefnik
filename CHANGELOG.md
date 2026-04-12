# Changelog

## [Unreleased]

### Added

- **`@ksefnik/http` uses generated types from the live KSeF 2.0 OpenAPI contract.** `openapi-typescript` pulls `https://api.ksef.mf.gov.pl/docs/v2/openapi.json` into `src/generated/ksef-api.ts` (253 schemas, 59 paths). `session.ts`, `invoices.ts`, and `public-key.ts` now reference the generated types via `src/generated/index.ts` as single source of truth — breaking contract changes will be caught at compile time instead of silently in production. Regenerate with `pnpm --filter @ksefnik/http generate`. Runtime stays hand-written (HTTP layer, auth flow, retry, error mapping).
- **`isTruncated` handling in `fetchInvoices`** — when the metadata query hits the 10000-record technical limit, a typed `KsefApiError` with `detailCode: 'QUERY_TRUNCATED'` is thrown instead of silently returning a partial result. Callers must narrow the `dateRange` and retry.
- **`withHttpRetry`** — rate-limit aware retry wrapper replacing `withRetry` from core for HTTP calls. Honours `Retry-After` header on 429 (clamped to `maxRetryAfterMs: 30s`), exponential backoff for 5xx, no retry for other 4xx. Prevents retry storms on the `/invoices/query/metadata` limit of 8 req/s + 16 req/min.

### Fixed

- **Data loss in `fetchInvoices` pagination.** Previous termination condition `items.length < pageSize` broke the loop when a page was exactly `pageSize` with `hasMore: true`, silently dropping the remainder. Now only `hasMore === false` (or `isTruncated === true`) terminates.
- **Contract alignment discrepancies** found by comparing against live production OpenAPI:
  - `contextIdentifier.type: "nip"` → `"Nip"` (PascalCase, enum strict)
  - Challenge response: parse `timestampMs: integer` directly instead of converting from ISO `timestamp` string (cleaner, eliminates timezone parsing)
  - `RedeemedTokens` / `TokenInfo`: parse `validUntil: string` (ISO date-time) for real token expiry instead of falling back to 15-min default (`exp` field never existed in the spec)

### Changed


- **`@ksefnik/http`** — production HTTP client for KSeF 2.0 (`api.ksef.mf.gov.pl`). Implements the `KsefClient` interface from `@ksefnik/core` against the real MF endpoints. **Verified end-to-end against real `api.ksef.mf.gov.pl/v2`** (CodeFormers NIP, 10 real cost invoices retrieved 2026-04-11).
  - Full auth flow: `POST /auth/challenge` → RSA-OAEP-SHA256 encrypted `{token}|{timestampMs}` (ISO→ms conversion) → `POST /auth/ksef-token` → polling `GET /auth/{referenceNumber}` until `status.code === 200` (OCSP verification) → `POST /auth/token/redeem` → `Authorization: Bearer <accessToken>` + transparent `POST /auth/token/refresh`.
  - **Auto-fetch** of the MF RSA public key from `GET /security/public-key-certificates` (X.509 certificate wrapped as `-----BEGIN CERTIFICATE-----`); cached per client instance. `publicKeyPem` is now optional in both `KsefHttpClient` and `createHttpAdapter`.
  - Invoice retrieval: `POST /invoices/query/metadata` with the **flat** KSeF 2.0 body (`subjectType: "Subject2"`, `dateRange.dateType`, `from`, `to`). Paginated via `hasMore` / `pageOffset`. The response already includes `seller`, `buyer`, `grossAmount`, `currency`, so per-invoice XML fetch is **skipped by default** — opt-in via `params.includeXml`.
  - FA(2)/FA(3) XML parser extracts `invoiceNumber`, `sellerNip`, `buyerNip`, `grossAmountGrosze` (integer, in grosze), and `currency` (used only when `includeXml` is enabled).
  - `createHttpAdapter({ nip, token, environment })` helper that wraps `KsefAdapterImpl` from core. `publicKeyPem` optional.
  - Domain error classes: `KsefApiError`, `KsefAuthError`, `KsefRateLimitError` (with `retryAfter` from `Retry-After` header).
  - Crypto uses `node:crypto.createPublicKey` + `publicEncrypt` (accepts both SPKI PEM and full X.509 CERTIFICATE PEM).
  - Path traversal guard for all URL-interpolated references (`/auth/{ref}`, `/invoices/ksef/{ksefNumber}`, `/auth/sessions/{ref}`).
  - Smoke test scripts (`packages/http/scripts/smoke-test.mjs`, `env-probe.mjs`) for manual verification against `api-test` / `api-demo` / `api.ksef.mf.gov.pl`.
- **CLI flag `--adapter http|simulator`** (default `http`) plus `--public-key <pathOrPem>` for wiring the HTTP client from the command line. Env vars: `KSEFNIK_ADAPTER`, `KSEFNIK_PUBLIC_KEY_PEM`, `KSEFNIK_PUBLIC_KEY_PATH`.
- **`KsefAdapter.initSession?() / closeSession?()`** optional hooks in `@ksefnik/shared` so the facade and CLI can prime and tear down sessions for stateful adapters without breaking existing (simulator) consumers.

### Changed

- `ksefnik fetch` now uses the HTTP adapter by default. Pass `--adapter simulator` for the offline mock.
- `ksefnik mcp` initializes the HTTP adapter from env vars (`KSEFNIK_NIP`, `KSEFNIK_TOKEN`, `KSEFNIK_ENV`, `KSEFNIK_PUBLIC_KEY_PATH`) and calls `initSession()` before accepting MCP tool invocations.

### Not in this release

- `sendInvoice` and `getUpo` in `@ksefnik/http` throw `Error('not implemented in HTTP client MVP')` — planned for v0.2.
- Async export flow (`/invoices/exports`) — planned for v0.2.
- Multi-tenant MCP server (one instance handling multiple NIPs) — v0.2 (current release uses one MCP server per NIP via separate `.mcp.json` entries).
