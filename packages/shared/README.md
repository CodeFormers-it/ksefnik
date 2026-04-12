# @ksefnik/shared — typy TypeScript i schematy Zod dla KSeF SDK

**Wspólny kontrakt typów TypeScript i schematów Zod dla ekosystemu [Ksefnik](https://ksefnik.pl/)** — otwartego **KSeF SDK dla Node.js / TypeScript**, implementującego **Krajowy System e-Faktur (KSeF 2.0)**. Pakiet dostarcza modele domenowe (Invoice, BankTransaction, Match) i kontrakty adapterów używane przez `@ksefnik/core`, `@ksefnik/http`, `@ksefnik/mcp` i pluginy trzecie — wszystko, czego potrzebujesz, żeby zbudować własną integrację z polską e-fakturą albo własny adapter do KSeF 2.0 HTTP API.

Ten pakiet to fundament całego monorepo. Nie zawiera logiki biznesowej, nie wykonuje żadnych wywołań sieciowych. Definiuje wyłącznie **modele domenowe**, **interfejsy adapterów** i **błędy** — tak, żeby wszystkie pozostałe pakiety (`@ksefnik/core`, `@ksefnik/http`, `@ksefnik/mcp`, `@ksefnik/cli`, `@ksefnik/simulator`) i pluginy zewnętrzne mówiły tym samym językiem.

> Jeżeli piszesz własną integrację z KSeF, własny parser banku albo własny plugin reconcyliacyjny — zacznij właśnie tutaj. Importujesz typy, dziedziczysz kontrakt i dostajesz gotowe miejsce w pipeline. [Referencja API →](https://docs.ksefnik.pl/referencja/create-ksefnik/)

## Instalacja

```bash
pnpm add @ksefnik/shared zod
# lub
npm install @ksefnik/shared zod
```

`zod` jest peer-wymaganiem — pakiet nie narzuca wersji, bo `@ksefnik/shared` re-eksportuje schematy, które mają być używane również w kodzie konsumenta.

## Co jest w środku

### Schematy Zod (`schemas/`)

Wszystkie modele domenowe są zdefiniowane jako schematy Zod, z których wyprowadzane są też typy TypeScript. Dzięki temu te same definicje walidują dane w runtime **i** typują kod.

| Schemat | Opis |
|---|---|
| `InvoiceSchema` | Faktura KSeF — numer, data wystawienia, sprzedawca (NIP), nabywca (NIP), pozycje, kwoty netto/VAT/brutto, referencja KSeF, waluta |
| `BankTransactionSchema` | Pojedyncza operacja z wyciągu bankowego — data, kwota, nadawca, tytuł, NIP wyciągnięty z opisu |
| `MatchSchema` | Dopasowanie faktury do transakcji — `invoiceId`, `transactionId`, `score`, `strategy` (który pass to wykrył), `confidence` |
| `ReconciliationReportSchema` | Wynik pełnego runa reconcyliacji — zmatchowane, niezmatchowane faktury, niezmatchowane przelewy, statystyki |

**Kwoty są zawsze w groszach (integer).** Nigdy `number` jako float. `1 PLN = 100`. Unika problemów z arytmetyką zmiennoprzecinkową, które w księgowości potrafią się skończyć kontrolą z US.

```ts
import { InvoiceSchema, type Invoice } from '@ksefnik/shared'

const raw = await readFileAsJson('./invoice.json')
const invoice: Invoice = InvoiceSchema.parse(raw) // rzuci ZodError jeśli dane są niepoprawne

console.log(invoice.totalAmount) // liczba w groszach, np. 123456 = 1234,56 PLN
```

### Kontrakty adapterów (`types/`)

Interfejsy, które pozwalają podmieniać komponenty bez ruszania logiki biznesowej.

#### `KsefAdapter`

Wymagany kontrakt każdej integracji z KSeF. Implementują go:
- `@ksefnik/http` — produkcyjny klient HTTP do `api.ksef.mf.gov.pl`
- `@ksefnik/simulator` — offline mock do testów CI
- **Twój własny adapter** — np. z proxy, z custom cache, z firmowym middleware

```ts
import type {
  KsefAdapter,
  FetchInvoicesOpts,
  SendInvoiceInput,
  SendInvoiceResult,
  UpoResult,
  Invoice,
} from '@ksefnik/shared'

export class MyCustomKsefAdapter implements KsefAdapter {
  async fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]> { /* ... */ }
  async sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult> { /* ... */ }
  async getUpo(ksefReference: string): Promise<UpoResult> { /* ... */ }
  async initSession?(): Promise<void> { /* opcjonalne */ }
  async closeSession?(): Promise<void> { /* opcjonalne */ }
}
```

`FetchInvoicesOpts` ma m.in. `subjectType`: `'Subject1'` (sprzedaż — faktury gdzie firma jest wystawcą) lub `'Subject2'` (zakupy — faktury kosztowe, gdzie firma jest nabywcą). Domyślnie `Subject2`.

#### `BankStatementParser`

Kontrakt parsera wyciągu bankowego. Każdy parser deklaruje, czy potrafi obsłużyć dany plik (`canParse`) i jak go zmieni w listę `BankTransaction`.

```ts
export interface BankStatementParser {
  name: string
  canParse(content: string): boolean
  parse(content: string): BankTransaction[]
}
```

Gotowe implementacje w `@ksefnik/core`: MT940 (standard), mBank CSV, ING CSV, PKO BP CSV, Santander CSV. Jeżeli Twój bank eksportuje w innym formacie — zaimplementuj interfejs i zarejestruj parser w pipeline.

#### `ReconciliationPass`

Kontrakt pojedynczego przebiegu reconcyliacji. Każdy pass ma `order` (kolejność wywołania) i metodę `run`, która dostaje kontekst z jeszcze niezmatchowanymi fakturami i transakcjami i zwraca listę nowych dopasowań.

```ts
export interface ReconciliationPass {
  name: string
  order: number // core: 50–500, pluginy: 600+
  run(ctx: ReconciliationContext): Promise<Match[]>
}
```

Domyślne passy (`@ksefnik/core`): `ksef-ref` → `exact-nip-amount` → `invoice-ref` → `fuzzy-name` → `partial-payment` → `proximity`. Każdy kolejny działa tylko na tym, czego poprzedni nie dopasował.

#### `KsefPlugin`

Kontrakt pluginu rozszerzającego Ksefnik — dodaje własne passy reconcyliacyjne, hooki (`onReconciliationComplete`, `onInvoicesSynced`), narzędzia MCP, komendy CLI. Ładowany dynamicznie przez `try { await import(pkg) } catch {}` — jeśli pluginu nie ma, Ksefnik działa w wersji free bez rzucania wyjątku.

#### `Storage`

Interfejs warstwy persystencji (faktury, transakcje, matche). Domyślnie `@ksefnik/core` udostępnia `InMemoryStorage` i `SqliteStorage` — możesz podmienić na własną (Postgres, Prisma, cokolwiek).

### Klasy błędów (`errors/`)

```ts
import { KsefError, KsefValidationError, KsefAuthError, KsefRateLimitError } from '@ksefnik/shared'
```

- `KsefError` — bazowa klasa, z której dziedziczą pozostałe
- `KsefValidationError` — walidacja schematów, reguł biznesowych
- `KsefAuthError` — 401/403 z KSeF, wygasły token, zła sygnatura challenge
- `KsefRateLimitError` — 429, zawiera `retryAfter` w sekundach do użycia przez retry policy

## Dlaczego osobny pakiet

1. **Brak cyklicznych zależności.** `@ksefnik/core` zależy od `shared`. `@ksefnik/http` zależy od `shared` (i `core` tylko dla retry). `@ksefnik/simulator` zależy od `shared`. Bez wspólnego minimum jądro musiałoby wiedzieć o wszystkich implementacjach z góry.
2. **Lekki kontrakt dla pluginów.** Plugin nie musi ściągać całego core ani KSeF klienta, żeby zadeklarować typ swojego passa.
3. **Stabilny public API.** Wersja majorowa `@ksefnik/shared` = breaking change w kontraktach. Wszystko inne to detale implementacyjne.

## Stabilność

Projekt jest na etapie `0.x`. Do `1.0` kontrakty mogą się zmieniać między minorami. Po `1.0` obowiązuje semver — breaking change w eksportowanych typach = bump majora.

## Powiązane pakiety

| Pakiet | Opis |
|---|---|
| [`@ksefnik/core`](../core) | Silnik reconcyliacji, parsery bankowe, walidacja faktur |
| [`@ksefnik/http`](../http) | Produkcyjny klient HTTP do KSeF 2.0 |
| [`@ksefnik/simulator`](../simulator) | Offline mock KSeF do testów |
| [`@ksefnik/mcp`](../mcp) | Model Context Protocol server (integracja z Claude) |
| [`@ksefnik/cli`](../cli) | CLI oparte o Commander + @clack/prompts |

## Licencja

MIT. Część monorepo [ksefnik](../../README.md) rozwijanego przez [CodeFormers.it](https://codeformers.it/) — software house specjalizujący się w TypeScript, automatyzacji procesów biznesowych i integracjach z polskimi systemami państwowymi (KSeF, e-Doręczenia, ePUAP, KRS, CEIDG). Jeżeli potrzebujesz wdrożenia KSeF skrojonego pod konkretny system ERP — [napisz do nas](https://codeformers.it/).
