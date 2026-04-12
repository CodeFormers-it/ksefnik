# @ksefnik/http — KSeF 2.0 Research Notes (H00)

> Źródła prawdy: https://github.com/CIRFMF/ksef-docs (pobrane 2026-04-11)
> OpenAPI: https://github.com/CIRFMF/ksef-docs/blob/main/open-api.json

## H00.1 — Źródła

| Plik docs | Zawartość |
|---|---|
| `uwierzytelnianie.md` | Flow uwierzytelniania (XAdES + KSeF Token) |
| `auth/sesje.md` | Lifecycle sesji (list, revoke) |
| `pobieranie-faktur/pobieranie-faktur.md` | Sync query + async export |
| `pobieranie-faktur/przyrostowe-pobieranie-faktur.md` | Incremental download |
| `srodowiska.md` | Base URLs (test/demo/prod) |
| `limity/limity-api.md` | Rate limits per endpoint |
| `open-api.json` | Pełna spec OpenAPI 3 |

## H00.2 — Auth decision: **Scenariusz C (hybrydowy)**

KSeF 2.0 **NIE** jest prostym Bearer (A) ani pełnym challenge+AES-GCM (B) jak KSeF 1.0.

Zamiast tego:

1. `POST /auth/challenge` → `{ challenge, timestamp }`
2. Klient lokalnie liczy: `encryptedToken = base64( RSA-OAEP-SHA256( publicKeyMF, "${ksefToken}|${timestamp}" ) )`
3. `POST /auth/ksef-token` → `{ authenticationToken, referenceNumber }` (temp JWT)
4. Opcjonalny polling `GET /auth/{referenceNumber}` (dla production z OCSP)
5. `POST /auth/token/redeem` (header `Authorization: Bearer <authenticationToken>`) → `{ accessToken, refreshToken }`
6. **Wszystkie kolejne requesty**: `Authorization: Bearer <accessToken>`
7. Przed wygaśnięciem `accessToken` (~15 min): `POST /auth/token/refresh` z `Authorization: Bearer <refreshToken>`

### Crypto wymaganie

- **TYLKO RSA-OAEP SHA-256**, bez AES-GCM (spec ksefnika był overshoot wrt KSeF 1.0).
- `node:crypto` `webcrypto.subtle` wystarczy. Zero deps.
- Klucz publiczny MF dostarczany w `KsefHttpClientOptions.publicKeyPem` (opcja) lub fetchowany z endpointu — **DO POTWIERDZENIA w kolejnej iteracji**. Na razie wymagany od usera albo z fallbackiem na znany PEM dla test env (TBD).

### Konsekwencje dla planu

- H03 **potrzebny**, ale tylko `rsaOaepEncrypt`. AES-GCM skipujemy.
- H04.2 realizuje flow challenge → ksef-token → redeem + refresh.

## H00.3 — Mapowanie endpointów

Base path (z OpenAPI `servers[0].url`): `/v2`. Pełne URLe:

| Environment | Base URL |
|---|---|
| production | `https://api.ksef.mf.gov.pl/v2` |
| demo       | `https://api-demo.ksef.mf.gov.pl/v2` |
| test       | `https://api-test.ksef.mf.gov.pl/v2` |

Ścieżki (względem base URL):

| Operacja | Method | Ścieżka |
|---|---|---|
| Challenge | POST | `/auth/challenge` |
| KSeF Token auth | POST | `/auth/ksef-token` |
| Auth status | GET | `/auth/{referenceNumber}` |
| Token redeem | POST | `/auth/token/redeem` |
| Token refresh | POST | `/auth/token/refresh` |
| Sessions list | GET | `/auth/sessions` |
| Revoke current session | DELETE | `/auth/sessions/current` |
| Revoke by ref | DELETE | `/auth/sessions/{referenceNumber}` |
| Query invoice metadata | POST | `/invoices/query/metadata` |
| Fetch single invoice | GET | `/invoices/ksef/{ksefNumber}` |
| Async export init | POST | `/invoices/exports` |
| Async export status | GET | `/invoices/exports/{referenceNumber}` |

**Decyzja MVP**: dla `KsefHttpClient.fetchInvoices()` używamy **sync** ścieżki `POST /invoices/query/metadata` + `GET /invoices/ksef/{ksefNumber}` per invoice. Async export (`/invoices/exports`) zostawiamy na v2 (duży wolumen, szyfrowane paczki).

## H00.4 — Open Questions (odpowiedzi)

1. **Auth flow?** → Scenariusz C (challenge → ksef-token → redeem). RSA-OAEP only.
2. **Endpointy?** → Patrz H00.3. Base `/v2`, nie `/api/v2`.
3. **JSON czy XML?** → **JSON** dla auth/query/metadata. XML tylko dla samego dokumentu faktury (FA(2)/FA(3)) który jest pobrany binarnie przez `/invoices/ksef/{ksefNumber}`.
4. **Page size limit?** → Docs `limity-api.md` nie podają explicite dla `/invoices/query/metadata`. Domyślnie konserwatywnie `pageSize=100`, parametry `pageOffset` i `pageSize`.
5. **Rate limits?** → `/invoices/query/metadata`: 8 req/s, 16 req/min, 20 req/h. `/invoices/ksef/{ksef}`: 8 req/s, 16 req/min, 64 req/h. Default: 10/s, 30/min, 120/h. Enforcement: sliding window, HTTP 429 + `Retry-After` header.
6. **Produkcja vs test?** → API 1:1 (różnica: OCSP verification delay w produkcji, test brak).
7. **Token KSeF → session token?** → Tak, trzeba wymienić: `ksefToken` (generowany w portalu) → `authenticationToken` (temp) → `accessToken` (~15 min) + `refreshToken` (~7 dni).
8. **Oficjalny OpenAPI?** → Tak, `open-api.json` w `CIRFMF/ksef-docs`. Rozważamy `openapi-typescript` jako augmentację w v2.
9. **Oficjalny klient MF?** → Istnieje `CIRFMF/ksef-client-ts` repo — **UWAGA**: nie testowane w kontekście ksefnika. Decyzja: **piszemy własnego**, bez zależności od MF-owego klienta (kontrola jakości, brak surprise deps). W przyszłości — rozważenie wrappera.
10. **Kody błędów?** → HTTP semantyka: 401 → `KsefAuthError`, 403 → `KsefAuthError` (forbidden, zwykle brak uprawnień), 429 → `KsefRateLimitError` (czytać `Retry-After`), 4xx inne → `KsefApiError`, 5xx → `KsefApiError` (retryable przez `withRetry`). Payload błędu: `{ exception: { exceptionDetailList: [{ exceptionCode, exceptionDescription }] } }` — do potwierdzenia.

## Różnice od oryginalnego spec'u (KSEFNIK-HTTP-ADAPTER-SPEC.md)

Oryginalny spec bazował na KSeF 1.0 (`/online/Session/InitToken`, XML payloads, `SessionToken` header, AES-GCM sessionKey). KSeF 2.0 jest:

- **REST + JSON** zamiast SOAP-ish XML
- **Dwufazowy JWT** (authenticationToken → accessToken+refreshToken) zamiast single sessionToken z 2h ważności
- **Brak AES-GCM** — tylko RSA-OAEP do szyfrowania payloadu `token|timestamp`
- **`/v2` base path** zamiast `/api/online/...`
- `subjectType` → prawdopodobnie `subject1`/`subject2` — do weryfikacji w parserze FA XML (spec ksefnika zakłada `subject2` dla kosztowych, zostajemy przy tym)

**Plan http_plan.md pozostaje strukturalnie ważny**. Mapowanie:

- H03 crypto → tylko `rsaOaepEncrypt` (AES-GCM skipped)
- H04 session → realizuje challenge → ksef-token → redeem + refresh lifecycle
- H05 fetchInvoices → query/metadata + per-invoice GET, paginate, FA(2)/FA(3) parse dla grossAmount

## Status

- [x] H00.1 źródła zebrane
- [x] H00.2 decyzja auth (scenariusz C)
- [x] H00.3 mapowanie endpointów
- [x] H00.4 open questions rozstrzygnięte
