# T02 — @ksefnik/shared

**Dependencies**: T01
**Lokalizacja**: `packages/shared/src/`
**Konwencje**: Money as integers (grosze), Zod everywhere, NIP = 10-cyfrowy string z checksumą

---

## T02.1 — Zod Schemas: Invoice & BankTransaction {#t021}

**Pliki:**
- `src/schemas/invoice.schema.ts`
- `src/schemas/bank-transaction.schema.ts`
- `src/schemas/index.ts`
- `src/__tests__/invoice.schema.test.ts`
- `src/__tests__/bank-transaction.schema.test.ts`

**Invoice schema — pola:**
| Pole | Typ | Uwagi |
|---|---|---|
| id | `z.string().uuid()` | |
| invoiceNumber | `z.string().min(1)` | np. FV/2026/03/001 |
| sellerNIP | `z.string().regex(/^\d{10}$/)` | + refine: checksum |
| buyerNIP | `z.string().regex(/^\d{10}$/).optional()` | B2C = brak |
| grossAmount | `z.number().int().positive()` | **grosze** |
| netAmount | `z.number().int().positive().optional()` | grosze |
| vatAmount | `z.number().int().nonnegative().optional()` | grosze |
| currency | `z.literal('PLN')` | na razie tylko PLN |
| issueDate | `z.string().date()` | ISO 8601 |
| salesDate | `z.string().date().optional()` | |
| dueDate | `z.string().date().optional()` | |
| ksefReference | `z.string().optional()` | numer KSeF (art. 108g) |
| sellerName | `z.string().optional()` | |
| buyerName | `z.string().optional()` | |
| description | `z.string().optional()` | |
| lineItems | array of LineItem, optional | |
| rawXml | `z.string().optional()` | oryginalny XML |
| createdAt | `z.string().datetime()` | |

**BankTransaction schema — pola:**
| Pole | Typ | Uwagi |
|---|---|---|
| id | `z.string().uuid()` | |
| date | `z.string().date()` | ISO 8601 |
| amount | `z.number().int()` | grosze, ujemne = wychodzący |
| description | `z.string()` | tytuł przelewu |
| senderName | `z.string().optional()` | |
| senderNIP | `z.string().regex(/^\d{10}$/).optional()` | extracted |
| recipientName | `z.string().optional()` | |
| recipientNIP | `z.string().regex(/^\d{10}$/).optional()` | |
| bank | `z.enum(['mt940','mbank','ing','pko','santander','other'])` | |
| raw | `z.string()` | oryginalna linia/obiekt |
| createdAt | `z.string().datetime()` | |

**NIP checksum** — helper function do refine: wagi `[6,5,7,2,3,4,5,6,7]`, suma mod 11 == ostatnia cyfra.

**Testy**: Walidacja poprawnych danych, odrzucanie złych NIP, ujemnych kwot, brakujących pól.

---

## T02.2 — Zod Schemas: Match & ReconciliationReport {#t022}

**Pliki:**
- `src/schemas/match.schema.ts`
- `src/schemas/reconciliation-report.schema.ts`
- `src/__tests__/match.schema.test.ts`
- `src/__tests__/reconciliation-report.schema.test.ts`

**Match schema:**
| Pole | Typ |
|---|---|
| id | uuid |
| invoiceId | uuid |
| transactionId | uuid |
| transactionIds | `z.array(z.string().uuid()).optional()` | dla partial |
| confidence | `z.number().int().min(0).max(100)` |
| passName | `z.string()` |
| reasons | `z.array(z.string())` |
| confirmed | `z.boolean().default(false)` |
| createdAt | datetime |

**ReconciliationReport schema:**
| Pole | Typ |
|---|---|
| id | uuid |
| matched | `z.array(MatchSchema)` |
| unmatchedInvoices | `z.array(InvoiceSchema)` |
| unmatchedTransactions | `z.array(BankTransactionSchema)` |
| summary | obiekt: totalInvoices, totalTransactions, matchedCount, unmatchedInvoiceCount, unmatchedTransactionCount, averageConfidence, passBreakdown (Record) |
| runAt | datetime |
| durationMs | `z.number().int()` |

---

## T02.3 — Type Interfaces: Plugin, Pass, Parser, Adapter, Storage, Config {#t023}

**Pliki:**
- `src/types/plugin.ts` — KsefPlugin interface
- `src/types/reconciliation-pass.ts` — ReconciliationPass, MatchingContext, MatchResult
- `src/types/bank-parser.ts` — BankStatementParser interface
- `src/types/ksef-adapter.ts` — KsefAdapter interface
- `src/types/storage.ts` — Storage interface
- `src/types/config.ts` — KsefnikConfig type
- `src/types/index.ts` — barrel re-export

**Kluczowe interfejsy:**

```typescript
interface ReconciliationPass {
  name: string
  order: number  // core: 100-500, plugins: 600+
  run(context: MatchingContext): Promise<MatchResult[]>
}

interface MatchingContext {
  invoices: Invoice[]
  transactions: BankTransaction[]
  alreadyMatched: Match[]
}

interface KsefPlugin {
  name: string
  version: string
  reconciliationPasses?(): ReconciliationPass[]
  onReconciliationComplete?(report: ReconciliationReport): Promise<void>
  onInvoicesSynced?(invoices: Invoice[]): Promise<void>
  mcpTools?(): McpToolDefinition[]
  cliCommands?(): CliCommand[]
}

interface BankStatementParser {
  bank: string
  canParse(content: string | Buffer): Promise<boolean>
  parse(content: string | Buffer): Promise<BankTransaction[]>
}

interface KsefAdapter {
  fetchInvoices(opts: FetchInvoicesOpts): Promise<Invoice[]>
  sendInvoice(input: SendInvoiceInput): Promise<SendInvoiceResult>
  getUpo(ksefReference: string): Promise<UpoResult>
}

interface Storage {
  saveInvoices(invoices: Invoice[]): Promise<void>
  getInvoices(query?: InvoiceQuery): Promise<Invoice[]>
  saveTransactions(txs: BankTransaction[]): Promise<void>
  getTransactions(query?: TransactionQuery): Promise<BankTransaction[]>
  saveReport(report: ReconciliationReport): Promise<void>
  getReport(id: string): Promise<ReconciliationReport | null>
}
```

---

## T02.4 — Typed Errors & Barrel Export {#t024}

**Pliki:**
- `src/errors/base.ts` — KsefnikError base class (code, message, context?)
- `src/errors/ksef.error.ts` — KsefApiError, KsefSessionError, KsefTimeoutError
- `src/errors/validation.error.ts` — InvoiceValidationError (rule, field, value)
- `src/errors/bank.error.ts` — BankParseError, UnsupportedBankFormatError
- `src/errors/reconciliation.error.ts` — ReconciliationError
- `src/errors/index.ts`
- `src/index.ts` — barrel re-exporting: schemas, types, errors
- `src/__tests__/errors.test.ts`

**Error codes**: `KSEF_API_*`, `KSEF_SESSION_*`, `VALIDATION_*`, `BANK_PARSE_*`, `BANK_FORMAT_*`, `RECONCILIATION_*`
