# @ksefnik/core — silnik KSeF SDK dla TypeScript / Node.js

**Reconcyliacja faktur z Krajowego Systemu e-Faktur (KSeF 2.0) z wyciągami bankowymi, parsery polskich banków (MT940, mBank, ING, PKO BP, Santander), walidacja faktur FA(2)/FA(3) i plugin system.** Core [Ksefnika](https://ksefnik.pl/) — otwartego **KSeF SDK dla TypeScript / Node.js**, znanego również jako *KSeF Node.js client*, *Polish e-Invoice API library*, *National e-Invoice System SDK* albo *e-faktura SDK*.

Cała logika biznesowa SDK znajduje się w tym pakiecie. CLI, MCP server i hosted API to tylko cienkie wrappery nad `@ksefnik/core`. Jeżeli chcesz zintegrować reconcyliację KSeF ze swoim systemem (ERP, backend aplikacji księgowej, Next.js API route, workflow w n8n, agent AI) — importujesz `createKsefnik()`, podpinasz adapter KSeF i warstwę persystencji, i masz gotowy pipeline.

## Instalacja

```bash
pnpm add @ksefnik/core @ksefnik/shared
# do produkcji dochodzi adapter HTTP:
pnpm add @ksefnik/http
# do testów offline:
pnpm add -D @ksefnik/simulator
```

**Wymagania**: Node.js 22+, TypeScript 5.7+ (strict mode rekomendowany).

## Szybki start

```ts
import { createKsefnik } from '@ksefnik/core'
import { createHttpAdapter } from '@ksefnik/http'
import { readFileSync } from 'node:fs'

const adapter = createHttpAdapter({
  nip: '7010002137',
  token: process.env.KSEF_TOKEN!,
  environment: 'production',
  publicKeyPem: readFileSync('./ksef-public-key.pem', 'utf8'),
})

const ksef = createKsefnik({
  config: { nip: '7010002137', environment: 'production', token: process.env.KSEF_TOKEN! },
  adapter,
})

await adapter.initSession?.()

// 1. Pobierz faktury kosztowe za marzec
const invoices = await ksef.invoices.fetch({
  from: '2026-03-01',
  to: '2026-03-31',
  subjectType: 'Subject2', // Subject2 = zakupy, Subject1 = sprzedaż
})

// 2. Zaimportuj wyciąg bankowy (auto-detekcja: MT940 / mBank / ING / PKO / Santander)
const transactions = await ksef.bank.importFromString(readFileSync('./wyciag.mt940', 'utf8'))

// 3. Odpal 6-stopniowy pipeline reconcyliacji
const report = await ksef.reconciliation.run({ invoices, transactions })

console.log(`Dopasowane: ${report.matched.length}`)
console.log(`Niedopasowane faktury: ${report.unmatchedInvoices.length}`)
console.log(`Niedopasowane przelewy: ${report.unmatchedTransactions.length}`)

await adapter.closeSession?.()
```

## Co robi ten pakiet

### 1. Reconciliation Engine — 6-stopniowy pipeline

Reconcyliacja KSeF ↔ bank to w praktyce mnóstwo krawędziowych przypadków: jeden przelew za kilka faktur, częściowe płatności, błędy w tytułach, kompensaty, kontrahenci z literówkami. Klasyczny SQL `JOIN ON amount AND date` daje może 40% trafień. `@ksefnik/core` implementuje **kaskadowy pipeline** — każdy pass działa tylko na tym, czego poprzedni nie rozstrzygnął, i każdy ma konfigurowalny `order`:

| # | Pass | Strategia | `order` |
|---|---|---|---|
| 1 | `ksef-ref` | Referencja KSeF wklejona w tytule przelewu (deterministyczne, 100% confidence) | 50 |
| 2 | `exact-nip-amount` | NIP kontrahenta + dokładna kwota + okienko dat | 100 |
| 3 | `invoice-ref` | Numer faktury w tytule przelewu (regex + normalizacja) | 200 |
| 4 | `fuzzy-name` | Fuzzy matching nazwy kontrahenta przez [fuzzball](https://www.npmjs.com/package/fuzzball), Levenshtein + token sort | 300 |
| 5 | `partial-payment` | Przelew ≤ kwota faktury, ten sam NIP, bliski termin | 400 |
| 6 | `proximity` | NIP + kwota ±tolerancja + data ±N dni (ostatnia szansa) | 500 |

Każdy pass zwraca `Match` z polem `confidence` (`high` / `medium` / `low`), `strategy` (nazwa passu) i `score` — dzięki temu w raporcie wiesz, **dlaczego** dane dopasowanie zostało wykryte i możesz je z automatu zaakceptować albo skierować do ręcznej weryfikacji.

Pluginy mogą dokładać własne passy z `order >= 600`, żeby uruchamiać się po passach core. Przykłady, które widzimy u klientów: dopasowanie faktur zbiorczych z jednego przelewu, reconcyliacja kompensat, rozpoznawanie not korygujących.

```ts
import { runPipeline, defaultPasses } from '@ksefnik/core'

const matches = await runPipeline({
  invoices,
  transactions,
  passes: [...defaultPasses, myCustomPass], // dołóż własne passy
})
```

### 2. Bank Parsers — polskie banki out-of-the-box

Importujesz plik wyciągu jedną funkcją. Auto-detekcja formatu (na podstawie sygnatur w treści), ekstrakcja NIP z tytułów przelewów, normalizacja kwot do groszy (int), mapowanie na `BankTransaction`.

```ts
import {
  importBankStatementFromString,
  importBankStatement,
  detectBankFormat,
  extractFirstNIP,
} from '@ksefnik/core'

// Z pliku na dysku
const transactions = await importBankStatement('./export.csv')

// Z bufora w pamięci (np. z S3)
const txs = await importBankStatementFromString(content)

// Ręczna detekcja
const format = detectBankFormat(content) // 'mt940' | 'mbank' | 'ing' | 'pko' | 'santander' | null

// NIP z dowolnego stringa (tytuł przelewu, opis, note)
const nip = extractFirstNIP('Faktura FV/2026/03/001 NIP 7010002137')
// → '7010002137'
```

Wspierane formaty:

| Format | Parser | Uwagi |
|---|---|---|
| **MT940** (SWIFT) | `Mt940Parser` | Standard, obsługiwany przez wszystkie polskie banki |
| **mBank CSV** | `MbankParser` | Eksport z mBank Business |
| **ING CSV** | `IngParser` | Eksport z Moje ING / ING Business |
| **PKO BP CSV** | `PkoParser` | Eksport z iPKO / iPKO Biznes |
| **Santander CSV** | `SantanderParser` | Eksport z Santander Mini Firma / Moja Firma Plus |

Własny parser? Zaimplementuj interfejs `BankStatementParser` z `@ksefnik/shared` i zarejestruj go przed wywołaniem pipeline.

### 3. Walidacja faktur (`validation/`)

Przed wysłaniem do KSeF faktura musi przejść walidację strukturalną **i** biznesową. Ministerstwo Finansów ma oficjalną listę kilkudziesięciu reguł. `@ksefnik/core` implementuje zestaw najczęściej łamanych:

- format i poprawność NIP (wystawca, nabywca, sprawdzanie sumy kontrolnej, blokada `0000000000`)
- walidacja waluty (ISO 4217), kursu, kwot (dodatnie, bez `NaN`, w granicach limitów)
- spójność kwot netto + VAT = brutto z tolerancją groszy
- poprawność stawek VAT (PL: `0`, `5`, `8`, `23`, `zw`, `np`, `oo`)
- daty: format, kolejność (sprzedaży ≤ wystawienia), brak dat z przyszłości
- wymagane pola (numer, typ dokumentu, strony)
- duplikaty (ten sam `invoiceNumber` dla tego samego NIP)
- długość opisów, format numeru faktury, format referencji KSeF

```ts
import { validateInvoices, allRules } from '@ksefnik/core'

const report = validateInvoices(invoices, { rules: allRules })

if (!report.valid) {
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.invoiceId}: ${issue.message}`)
  }
}
```

Każda reguła implementuje interfejs `ValidationRule`, więc możesz dodać własne (np. regułę firmową: "kwota brutto > 10k PLN wymaga pola `costCenter`") bez ruszania core.

### 4. Plugin system

Wszystko rozszerzalne przez pluginy. Mechanizm ładowania:

```ts
// plugin-loader.ts
try {
  await import('@ksefnik-pro/partial-payments')
} catch {
  // plugin nie zainstalowany — działamy w wersji free
}
```

Plugin implementuje `KsefPlugin` z `@ksefnik/shared` i może dostarczyć:

- własne `reconciliationPasses()` — dodatkowe strategie matchingu
- hooki `onReconciliationComplete`, `onInvoicesSynced`
- narzędzia MCP (`mcpTools()`) dla Claude Desktop
- komendy CLI (`cliCommands()`)

**Brak DRM, brak phone-home, brak license validation w runtime.** Plugin albo jest w `node_modules`, albo go nie ma.

### 5. Storage

Do persystencji faktur, transakcji i matchy między runami. Dwie gotowe implementacje:

```ts
import { InMemoryStorage, SqliteStorage } from '@ksefnik/core'

const ksef = createKsefnik({
  config: { /* ... */ },
  adapter,
  storage: new SqliteStorage('./ksefnik.db'), // albo InMemoryStorage() do testów
})
```

Możesz podmienić na własną warstwę (Postgres + Prisma, Redis, Mongo) implementując interfejs `Storage` z `@ksefnik/shared`.

### 6. Adapter KSeF — retry, cache, sesja

Dodatkowe utility do budowy własnych adapterów:

```ts
import { withRetry, TtlCache, cacheKey, SessionManager } from '@ksefnik/core'

// Exponential backoff z honorowaniem Retry-After z 429
const result = await withRetry(() => client.fetchInvoices(opts), { maxAttempts: 5 })

// TTL cache na metadane, klucze publiczne MF itd.
const cache = new TtlCache<string, PublicKey>({ ttlMs: 60 * 60 * 1000 })
```

## Architektura — fasada z namespacami

`createKsefnik()` zwraca obiekt z trzema namespacami:

```ts
const ksef = createKsefnik({ /* ... */ })

ksef.invoices.fetch(opts)              // pobierz z KSeF i zapisz do storage
ksef.invoices.send(input)              // wyślij fakturę do KSeF (wymaga adaptera z sendInvoice)
ksef.invoices.validate(invoices)       // odpal walidatory

ksef.bank.importFromString(content)    // sparsuj + zapisz transakcje
ksef.bank.importFromFile(path)

ksef.reconciliation.run(opts)          // odpal pipeline
```

Każdy namespace operuje na wstrzykniętym `adapter` (KSeF I/O) i `storage` (persystencja). Core nie wie o HTTP, nie wie o SQLite — wie tylko o interfejsach.

## Dlaczego SDK-first

- **Testowalność.** Wstrzykujesz `MockKsefAdapter` z `@ksefnik/simulator` i odpalasz cały pipeline offline w CI. Zero requestów do `api.ksef.mf.gov.pl`, deterministyczne scenariusze.
- **Portowalność.** Ta sama logika działa w serverless (Vercel Functions, Lambda), w długo żyjącym procesie (dedykowany worker), w CLI, w MCP serverze dla Claude i w n8n. Brak frameworków — czyste TypeScripty.
- **Brak vendor lock-in.** Swap adaptera HTTP pod własny proxy, swap storage pod Postgres, swap parser pod własny bank — bez forka core.

## Stack

TypeScript (strict) · Node.js 22 · Zod · fuzzball · mt940js · better-sqlite3

## Powiązane pakiety

- [`@ksefnik/shared`](../shared) — kontrakty, schematy Zod
- [`@ksefnik/http`](../http) — produkcyjny klient HTTP
- [`@ksefnik/simulator`](../simulator) — mock KSeF do CI
- [`@ksefnik/mcp`](../mcp) — Model Context Protocol server
- [`@ksefnik/cli`](../cli) — CLI

## Licencja

MIT. Część monorepo [ksefnik](../../README.md). Rozwijane przez [CodeFormers.it](https://codeformers.it/) — software house z Krakowa, budujący integracje KSeF, automatyzacje backoffice i dedykowane systemy księgowe w TypeScript. Jeżeli chcesz wpiąć Ksefnika w swój ERP albo potrzebujesz customowych passów reconcyliacyjnych — [porozmawiajmy](https://codeformers.it/).
