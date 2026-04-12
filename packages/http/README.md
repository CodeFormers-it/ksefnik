# @ksefnik/http — KSeF 2.0 API client dla TypeScript / Node.js

**Produkcyjny klient HTTP do Krajowego Systemu e-Faktur (KSeF 2.0)** — pełen flow uwierzytelnienia z challenge + **RSA-OAEP SHA-256**, pobieranie metadanych faktur, parsowanie XML **FA(2)/FA(3)**, retry z honorowaniem `Retry-After`, mapowanie błędów na typowane wyjątki. Część [Ksefnika](https://ksefnik.pl/) — otwartego **KSeF SDK dla Node.js**, znanego też jako *KSeF API client*, *Polish e-Invoice API*, *National e-Invoice System HTTP client* albo *KSeF 2.0 TypeScript client*.

Implementuje interfejs `KsefClient` z `@ksefnik/core` i gada bezpośrednio z `api.ksef.mf.gov.pl` (KSeF 2.0, obowiązkowe od 2026-02-01). Podpinasz go do fasady `Ksefnik` przez `createHttpAdapter(...)` i masz produkcyjną integrację — bez pisania warstwy HTTP od zera, bez walki z kryptografią Ministerstwa Finansów, bez ręcznego parsera XML. Jeżeli szukasz gotowego **klienta HTTP do polskiej e-faktury**, który przeżyje audyt bezpieczeństwa i nie ciągnie 40 zależności trzecich — to jest właśnie on.

> **Źródło prawdy**: [CIRFMF/ksef-docs](https://github.com/CIRFMF/ksef-docs). Szczegóły flow, mapa endpointów i limity — w [NOTES.md](./NOTES.md).

## Instalacja

```bash
pnpm add @ksefnik/http @ksefnik/core @ksefnik/shared
```

## Użycie

```ts
import { createKsefnik } from '@ksefnik/core'
import { createHttpAdapter } from '@ksefnik/http'
import { readFileSync } from 'node:fs'

const adapter = createHttpAdapter({
  nip: '7010002137',
  token: process.env.KSEF_TOKEN!,
  environment: 'production',
  publicKeyPem: readFileSync('./mf-public.pem', 'utf8'),
})

const ksef = createKsefnik({
  config: { nip: '7010002137', environment: 'production', token: process.env.KSEF_TOKEN! },
  adapter,
})

await adapter.initSession?.()
const invoices = await ksef.invoices.fetch({ from: '2026-03-01', to: '2026-03-31' })
await adapter.closeSession?.()
```

## Środowiska

| Environment | Bazowy URL |
|---|---|
| `production` | `https://api.ksef.mf.gov.pl/v2` |
| `demo`       | `https://api-demo.ksef.mf.gov.pl/v2` |
| `test`       | `https://api-test.ksef.mf.gov.pl/v2` |

## Flow uwierzytelnienia (KSeF 2.0)

1. `POST /auth/challenge` — serwer zwraca `{ challenge, timestamp }`.
2. Klient szyfruje `"{ksefToken}|{timestamp}"` algorytmem **RSA-OAEP SHA-256** przy użyciu klucza publicznego MF.
3. `POST /auth/ksef-token` — serwer zwraca `{ authenticationToken, referenceNumber }` (tymczasowy JWT).
4. `POST /auth/token/redeem` z `Authorization: Bearer <authenticationToken>` — serwer zwraca `{ accessToken, refreshToken }`.
5. Kolejne wywołania używają `Authorization: Bearer <accessToken>`.
6. Przed wygaśnięciem accessToken klient sam odpala `POST /auth/token/refresh` z refresh tokenem.

Kryptografia: **wyłącznie RSA-OAEP SHA-256**, zaimplementowana przez `node:crypto` `webcrypto.subtle`. Zero zewnętrznych zależności kryptograficznych — nie musisz ufać `jose`, `crypto-js` ani żadnemu innemu pakietowi trzeciemu w sprawach podpisywania.

## Obsługa błędów

```ts
import { KsefApiError, KsefAuthError, KsefRateLimitError } from '@ksefnik/http'

try {
  await ksef.invoices.fetch(/* ... */)
} catch (error) {
  if (error instanceof KsefAuthError) {
    // 401/403 — refresh token wygasł, przewygeneruj token KSeF w portalu MF
  } else if (error instanceof KsefRateLimitError) {
    // 429 — honoruj error.retryAfter (sekundy) i retry
  } else if (error instanceof KsefApiError) {
    // Inne 4xx/5xx — szczegóły w error.statusCode i error.detailCode
  }
}
```

`withRetry` z `@ksefnik/core` automatycznie retry'uje `KsefRateLimitError` i odpowiedzi `5xx` z exponential backoff — więc w praktyce kod powyżej ratuje Cię przed przypadkami, których retry sensownie nie rozwiąże.

## Limity ratelimit

Zgodnie z [limity-api.md](https://github.com/CIRFMF/ksef-docs/blob/main/limity/limity-api.md):

| Endpoint | req/s | req/min | req/h |
|---|---|---|---|
| `POST /invoices/query/metadata` | 8 | 16 | 20 |
| `GET /invoices/ksef/{ref}` | 8 | 16 | 64 |
| Default | 10 | 30 | 120 |

`fetchInvoices` domyślnie używa `mapWithConcurrency(5)`, żeby zmieścić się z buforem w tym oknie. Jeżeli masz własne potrzeby (np. chcesz łagodniej dociążać produkcję MF, bo wiesz, że Twój NIP ma wąski limit h/req) — konfigurujesz adapter.

## MVP — co jeszcze nie jest zrobione

- `sendInvoice` — stub, rzuca `"not implemented"`
- `getUpo` — stub, rzuca `"not implemented"`
- Asynchroniczny eksport (`POST /invoices/exports` + polling) — planowany w v0.1

**Co działa w MVP**: pełny auth flow, pobieranie faktur kosztowych i sprzedażowych, parsowanie FA(2)/FA(3), ekstrakcja kwot brutto, refresh tokenów, retry.

## Smoke test na środowisku testowym MF

```bash
KSEF_TEST_NIP=... \
KSEF_TEST_TOKEN=... \
KSEF_TEST_PUBLIC_KEY_PATH=./ksef-test-pub.pem \
pnpm --filter @ksefnik/http smoke
```

Skrypt rozmawia z `api-test.ksef.mf.gov.pl` dla ręcznej weryfikacji end-to-end. **Nie jest uruchamiany w CI** — do CI używaj [`@ksefnik/simulator`](../simulator).

## Generowanie typów z OpenAPI

Typy wszystkich request/response'ów KSeF 2.0 w `src/session.ts`, `src/invoices.ts` i `src/public-key.ts` są **generowane** z żywego kontraktu produkcyjnego MF przez [openapi-typescript](https://github.com/openapi-ts/openapi-typescript). Runtime (warstwa HTTP, retry, mapowanie błędów, orkiestracja sesji) jest ręcznie pisany, ale kształty danych są jednoźródłowe z MF.

```bash
pnpm --filter @ksefnik/http generate
```

Polecenie pobiera `https://api.ksef.mf.gov.pl/docs/v2/openapi.json` i zapisuje `src/generated/ksef-api.ts` (≈10k linii, 253 schematy, 59 endpointów). Wygenerowany plik jest zacommitowany do git — pakiet buduje się bez dostępu do sieci, ale powinien być odświeżany przy każdej zmianie specyfikacji MF.

### Workflow przy zmianie kontraktu

1. `pnpm --filter @ksefnik/http generate` — pulluje najnowszy kontrakt
2. `pnpm --filter @ksefnik/http build` — TypeScript od razu pokazuje, co się zmieniło breaking (brakujące pola, przemianowane enumy, zmiana nullability)
3. Fixy w callsite'ach w `session.ts` / `invoices.ts` / `public-key.ts`, aż build jest zielony
4. `pnpm --filter @ksefnik/http test` — unit + integration testy muszą przejść
5. `KSEF_ENV=production pnpm --filter @ksefnik/http smoke` — weryfikacja na żywym API

### Co generowane vs ręcznie pisane

| Warstwa | Źródło |
|---|---|
| Kształty request/response (challenge, ksef-token, redeem, refresh, auth status, query metadata, public key) | **generowane** — `src/generated/ksef-api.ts` |
| Runtime HTTP client (`src/http.ts`) | ręczny — fetch, AbortSignal timeout, User-Agent, parsowanie odpowiedzi |
| Mapowanie błędów na `KsefAuthError` / `KsefRateLimitError` / `KsefApiError` | ręczny — `src/errors.ts` + `src/http.ts` |
| Retry z honorowaniem `Retry-After` | ręczny — `src/retry.ts` |
| Orkiestracja flow auth (challenge → ksef-token → polling → redeem → refresh) | ręczny — `src/session.ts` |
| Paginacja, guard na `isTruncated`, concurrency | ręczny — `src/invoices.ts` |
| Fasada `KsefHttpClient` implementująca `KsefClient` z `@ksefnik/core` | ręczny — `src/client.ts` |

Wygenerowany plik dodaje ≈600KB do source control i ma **zero runtime cost** — to czyste typy (`.d.ts`-style), TSC usuwa je na etapie kompilacji.

## Powiązane pakiety

- [`@ksefnik/core`](../core) — silnik reconcyliacji, który woła adapter
- [`@ksefnik/shared`](../shared) — kontrakt `KsefAdapter`
- [`@ksefnik/simulator`](../simulator) — offline mock do testów (zamiast tego pakietu w CI)
- [`@ksefnik/cli`](../cli) — CLI, które domyślnie używa tego adaptera

## Licencja

MIT. Część monorepo [ksefnik](../../README.md). Rozwijane przez [CodeFormers.it](https://codeformers.it/) — specjalizujemy się w integracjach z polskimi systemami państwowymi (KSeF, e-Doręczenia, KRS, CEIDG, ePUAP) i budujemy dedykowane wdrożenia KSeF dla firm, które potrzebują czegoś więcej niż gotowy plugin do ERP. [Porozmawiajmy](https://codeformers.it/).
