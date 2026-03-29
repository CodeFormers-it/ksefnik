# Architektura ksefnik (open-source)

> Status: **decyzja** | Data: 2026-03-29

---

## Pakiety

5 pakietów + 1 app od startu:

```
ksefnik/
├── packages/
│   ├── shared/              # @ksefnik/shared
│   │   └── src/
│   │       ├── schemas/     # Zod: Invoice, BankTransaction, Match, Report
│   │       ├── types/       # KsefPlugin, ReconciliationPass, BankStatementParser
│   │       └── errors/      # Typed errors (KsefError, ValidationError, etc.)
│   │
│   ├── core/                # @ksefnik/core
│   │   └── src/
│   │       ├── index.ts     # createKsefnik() factory — jedyny public entry point
│   │       ├── ksefnik.ts   # Ksefnik facade (.invoices, .bank, .reconciliation, .plugins)
│   │       ├── ksef/        # Adapter na @ksef/client (retry, cache, session mgmt)
│   │       ├── bank/        # Parsery wyciągów bankowych
│   │       │   ├── parsers/ # MT940, mBank, ING, PKO, Santander
│   │       │   ├── nip-extractor.ts  # Regex + MPP structured format
│   │       │   └── auto-detect.ts    # Auto-detekcja formatu pliku
│   │       ├── matching/    # 6-pass reconciliation engine
│   │       │   ├── pipeline.ts       # Orkiestracja passów
│   │       │   ├── passes/           # ksef-ref, exact, invoice-ref, fuzzy, partial, proximity
│   │       │   └── scoring.ts        # Confidence scoring
│   │       ├── validation/  # Top 20 reguł pre-flight
│   │       ├── storage/     # bun:sqlite / in-memory
│   │       └── plugins/     # Plugin loader (dynamic import, try/catch)
│   │
│   ├── simulator/           # @ksefnik/simulator (devDependency)
│   │   └── src/
│   │       ├── index.ts     # createKsefSimulator()
│   │       ├── scenarios/   # happy-path, timeout, invalid-nip, session-expired, upo-delay
│   │       └── adapter.ts   # Podmienia prawdziwe KSeF API na mock
│   │
│   ├── mcp/                 # @ksefnik/mcp
│   │   └── src/
│   │       ├── server.ts    # McpServer factory
│   │       └── tools/       # 8 tools, each 5-15 lines delegating to Ksefnik
│   │
│   └── cli/                 # @ksefnik/cli
│       └── src/
│           ├── main.ts      # Commander.js + router
│           ├── commands/    # fetch, send, bank, reconcile, validate, mcp
│           └── interactive/ # @clack/prompts guided mode
│
├── apps/
│   └── build/               # bun build --compile for all targets
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/            # MT940, CSV, FA(3) XML samples
│
├── docs/                    # EN (primary) + PL
├── examples/
│   └── demo/                # 1-komendowy "aha moment"
├── LICENSE                  # MIT
├── README.md
└── README_PL.md
```

---

## Zależności między pakietami

```
@ksefnik/shared (zero dependencies — typy i schematy)
     ↑
@ksefnik/core (cała logika biznesowa)
     ↑              ↑              ↑
@ksefnik/cli    @ksefnik/mcp   @ksefnik/simulator
(thin)          (thin)          (devDependency)
```

- **shared** nie zależy od nikogo — eksportuje Zod schemas, typy, interfejsy pluginów, typed errors
- **core** zależy od shared — importuje typy i schematy, zawiera całą logikę
- **cli**, **mcp**, **simulator** zależą od core + shared — cienkie wrappery

---

## Flow danych

```
                    ┌─────────────────────┐
                    │    @ksefnik/core     │
                    │                     │
  KSeF API ──────► │  ksef/ (adapter)    │
                    │       ↓             │
                    │  invoices[]         │
                    │       ↓             │
  Bank file ─────► │  bank/ (parsers)    │
                    │       ↓             │
                    │  transactions[]     │
                    │       ↓             │
                    │  matching/          │
                    │  (6-pass pipeline)  │
                    │       ↓             │
                    │  ReconciliationReport│
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
          CLI output     JSON/CSV         MCP response
         (tabele)        (export)         (AI tool)
```

---

## Public API surface

### @ksefnik/core

```typescript
import { createKsefnik } from '@ksefnik/core'

const ksef = createKsefnik({ nip, environment, token })

// Facade — 3 namespace'y + plugins
ksef.invoices.fetch(opts)
ksef.invoices.send(invoice)
ksef.bank.import(filePath, opts?)
ksef.reconciliation.run({ invoices, transactions })
ksef.reconciliation.runFromFiles({ ksefOpts, bankFile })  // shortcut
ksef.plugins.register(plugin)
```

### @ksefnik/shared (re-eksportowane też z core)

```typescript
import type {
  Invoice,
  BankTransaction,
  ReconciliationReport,
  Match,
  KsefPlugin,
  ReconciliationPass,
  BankStatementParser
} from '@ksefnik/shared'
```

### @ksefnik/simulator

```typescript
import { createKsefSimulator } from '@ksefnik/simulator'

const sim = createKsefSimulator({
  scenario: 'happy-path',
  invoices: mockInvoices
})

const ksef = createKsefnik({ adapter: sim.adapter })
```

### @ksefnik/mcp

```typescript
import { createMcpServer } from '@ksefnik/mcp'

const server = createMcpServer({ ksef })
// 8 tools: sync-invoices, import-bank-statement, reconcile,
//          get-unmatched, query-invoices, send-invoice,
//          confirm-match, validate-invoice
```

### @ksefnik/cli

```bash
ksefnik fetch --from 2026-03-01 --to 2026-03-31
ksefnik bank import ./wyciag.mt940
ksefnik reconcile --bank ./wyciag.mt940
ksefnik validate ./faktura.xml
ksefnik mcp                          # uruchamia MCP server
```

---

## Reconciliation pipeline

6 passów, od najbardziej pewnego do najbardziej heurystycznego:

| Order | Pass | Strategia | Confidence |
|-------|------|-----------|------------|
| 100 | ksef-ref | Numer KSeF w tytule przelewu (art. 108g) | 99% |
| 200 | exact | Kwota + NIP z tytułu | 95% |
| 300 | invoice-ref | Numer faktury w tytule | 90% |
| 400 | fuzzy | Kwota + fuzzy match nazwy kontrahenta | 80% |
| 450 | partial | Suma przelewów od kontrahenta = kwota faktury | 70% |
| 500 | proximity | Kwota z tolerancją + bliskość dat | 50-70% |

Pro pluginy dodają passy z order 600+.

Każdy pass implementuje interfejs `ReconciliationPass`:

```typescript
interface ReconciliationPass {
  name: string
  order: number  // core: 100-500, plugins: 600+
  run(context: MatchingContext): Promise<MatchResult[]>
}
```

Pipeline jest iteracyjny — każdy pass operuje tylko na **jeszcze niedopasowanych** fakturach i transakcjach.

---

## Konwencje

- **Money as integers**: kwoty w groszach (1 PLN = 100), nigdy float
- **Zod everywhere**: wszystkie modele domenowe to Zod schemas
- **Adapter pattern**: @ksef/client opakowany w adapter (retry, cache, wymienialność)
- **Plugin by absence**: `try { await import(pkg) } catch {}` — brak pakietu = free tier
- **No DRM**: zero license validation, zero phone-home
- **Errors are typed**: każdy error ma `code`, `message`, `context`
