# @ksefnik/simulator — offline mock KSeF dla testów (TypeScript / Node.js)

**Mock serwera Krajowego Systemu e-Faktur (KSeF 2.0) do testów jednostkowych, integracyjnych i CI** — dla [Ksefnika](https://ksefnik.pl/), otwartego **KSeF SDK w TypeScript / Node.js**. Wstrzykujesz go w miejsce `@ksefnik/http`, odpalasz cały pipeline reconcyliacji offline, i masz deterministyczne, powtarzalne testy bez jednego requestu do `api.ksef.mf.gov.pl` — bez tokenu KSeF, bez klucza publicznego MF, bez zależności od dostępności środowiska testowego Ministerstwa Finansów.

Jeżeli szukasz **mocka do KSeF**, **test harness dla polskiej e-faktury** albo **KSeF sandbox offline** do CI w GitHub Actions — to jest ten pakiet.

Po co to w ogóle istnieje:

- **CI nie może rozmawiać z produkcją.** KSeF nie ma publicznego sandboxa otwartego dla każdego workflowa GitHub Actions.
- **Środowisko testowe MF (`api-test.ksef.mf.gov.pl`) bywa niestabilne.** W dniu releasu nie chcesz zielonego/czerwonego CI uzależnionego od tego, czy serwer resortowy akurat odpowiada.
- **Potrzebujesz scenariuszy brzegowych.** 429, timeout, wygasła sesja, błąd walidacji NIP, opóźnione UPO. Nie da się tego wymusić na produkcji.
- **Chcesz e2e bez sekretów.** Brak tokenu, brak klucza publicznego, brak NIP — `@ksefnik/simulator` działa w każdym workflow, również w forkach od zewnętrznych kontrybutorów.

## Instalacja

```bash
pnpm add -D @ksefnik/simulator @ksefnik/core @ksefnik/shared
```

Pakiet jest typowym **devDependency** — do produkcji idzie wyłącznie `@ksefnik/http`.

## Szybki start

```ts
import { createKsefnik } from '@ksefnik/core'
import { MockKsefAdapter, InvoiceStore, happyPath } from '@ksefnik/simulator'

// 1. Stwórz magazyn faktur i załaduj scenariusz
const store = new InvoiceStore()
happyPath(store) // dorzuca kilkanaście realistycznych faktur do store

// 2. Podepnij mock adapter
const adapter = new MockKsefAdapter(store)

const ksef = createKsefnik({
  config: { nip: '7010002137', environment: 'test', token: 'fake-token' },
  adapter,
})

// 3. Od teraz wszystko działa jak z prawdziwym KSeF — ale offline
const invoices = await ksef.invoices.fetch({ from: '2026-03-01', to: '2026-03-31' })
```

## Co jest w środku

### `MockKsefAdapter`

Implementacja `KsefAdapter` z `@ksefnik/shared` — ten sam interfejs co `@ksefnik/http`, więc kod produkcyjny nie wie, że odpowiada mu mock.

- `fetchInvoices(opts)` — filtruje `InvoiceStore` po dacie, NIP, `subjectType`
- `sendInvoice(input)` — generuje deterministyczną referencję `KSEF-SIM-<timestamp>-<random>`
- `getUpo(ref)` — zwraca symulowane UPO (z opcjonalnym opóźnieniem przez hook)
- `initSession()` / `closeSession()` — no-op, ale wołane tak jak przez HTTP adapter

Hooki pozwalają wstrzyknąć asercje lub wymusić błędy:

```ts
const adapter = new MockKsefAdapter(store, {
  beforeFetch: async (opts) => {
    expect(opts.from).toBe('2026-03-01')
  },
  beforeSend: async (input) => {
    if (input.nip === '0000000000') throw new Error('Invalid NIP')
  },
  beforeGetUpo: async (ref) => {
    if (ref.startsWith('KSEF-SIM-999')) return { ksefReference: ref, upoXml: '...', status: 'pending' }
    return null
  },
})
```

### `InvoiceStore`

In-memory magazyn faktur z filtrowaniem po zakresie dat. Używany przez adapter jako backend. Sam jest bardzo prosty — listy faktur wchodzą, listy faktur wychodzą — ale dzięki temu scenariusze są trywialne do pisania i czytania w code review.

### Scenariusze (`scenarios/`)

Gotowe "fixturki", które ładują realistyczne dane do `InvoiceStore`:

| Scenariusz | Zastosowanie |
|---|---|
| `happyPath(store)` | Reprezentatywny zestaw faktur sprzedażowych i zakupowych, różne kwoty, różne NIP-y, różne stawki VAT. Używaj jako default w testach jednostkowych reconcyliacji. |
| `timeout(store)` | Adapter zwraca się po konfigurowalnym opóźnieniu. Testuj retry policy, timeouty HTTP. |
| `invalidNip(store)` | Faktury z błędnymi NIP-ami (suma kontrolna, `0000000000`). Testuj pipeline walidacji. |
| `sessionExpired(store)` | `fetchInvoices` rzuca `KsefAuthError` przy pierwszym wywołaniu. Testuj ponowne logowanie i refresh tokenów. |
| `upoDelay(store)` | `getUpo` zwraca `status: 'pending'` przez pierwsze N wywołań. Testuj polling. |

Każdy scenariusz to jedna funkcja, więc trywialnie łączysz kilka na raz:

```ts
import { happyPath, upoDelay } from '@ksefnik/simulator'

happyPath(store)
upoDelay(store) // nadpisuje hook getUpo
```

### Własny scenariusz

```ts
import { InvoiceStore, type Invoice } from '@ksefnik/simulator'

export function myScenario(store: InvoiceStore) {
  const invoice: Invoice = {
    id: 'inv-001',
    ksefReference: 'KSEF-2026-03-001',
    invoiceNumber: 'FV/2026/03/001',
    issueDate: '2026-03-15',
    seller: { nip: '7010002137', name: 'Sprzedawca sp. z o.o.' },
    buyer: { nip: '5261040828', name: 'Nabywca S.A.' },
    totalAmount: 123456, // grosze
    currency: 'PLN',
    // ...
  }

  store.add(invoice)
}
```

## Testy z Vitest

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createKsefnik } from '@ksefnik/core'
import { MockKsefAdapter, InvoiceStore, happyPath } from '@ksefnik/simulator'

describe('reconciliation pipeline', () => {
  let ksef: ReturnType<typeof createKsefnik>

  beforeEach(() => {
    const store = new InvoiceStore()
    happyPath(store)
    const adapter = new MockKsefAdapter(store)
    ksef = createKsefnik({
      config: { nip: '7010002137', environment: 'test', token: 'test' },
      adapter,
    })
  })

  it('dopasowuje po referencji KSeF', async () => {
    const invoices = await ksef.invoices.fetch({ from: '2026-03-01', to: '2026-03-31' })
    const transactions = [/* ... */]
    const report = await ksef.reconciliation.run({ invoices, transactions })

    expect(report.matched).toHaveLength(invoices.length)
    expect(report.matched[0]?.strategy).toBe('ksef-ref')
  })
})
```

## Co to **nie** jest

- **Nie jest walidatorem schematu KSeF.** Nie sprawdza zgodności z XSD FA(2)/FA(3). Do tego służy `validation/` w `@ksefnik/core` + pełny walidator w `@ksefnik/pro` (planowany).
- **Nie jest load testerem.** Nie symuluje rate limitów MF (`8 req/s`, `20 req/h`) — to jest w `@ksefnik/http` i testy rate limit powinny używać prawdziwego klienta z mockowaniem `fetch`.
- **Nie symuluje kryptografii MF.** Challenge/response z RSA-OAEP SHA-256 jest w `@ksefnik/http`. Simulator pomija całą warstwę sesji.

## Powiązane pakiety

- [`@ksefnik/shared`](../shared) — kontrakt `KsefAdapter`
- [`@ksefnik/core`](../core) — silnik reconcyliacji, z którym łączysz simulator
- [`@ksefnik/http`](../http) — produkcyjny odpowiednik dla prawdziwego KSeF

## Licencja

MIT. Część monorepo [ksefnik](../../README.md) — open-source project od [CodeFormers.it](https://codeformers.it/). Jeżeli Twój zespół potrzebuje custom scenariuszy testowych KSeF pod skomplikowany flow księgowy (np. faktury zbiorcze, korekty, kompensaty, waluty obce) — [napisz do nas](https://codeformers.it/), robimy takie rzeczy na co dzień.
