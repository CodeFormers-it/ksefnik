# T10 — @ksefnik/mcp

**Dependencies**: T08
**Lokalizacja**: `packages/mcp/src/`
**Context7**: Sprawdź @modelcontextprotocol/sdk docs przed implementacją

---

## T10.1 — MCP Server Factory & First 4 Tools {#t101} ✅

**Pliki:**
- `src/server.ts` — `createMcpServer({ ksef })`, rejestruje tools
- `src/tools/sync-invoices.ts` — `{ dateFrom, dateTo }` → `Invoice[]`
- `src/tools/import-bank.ts` — `{ filePath, format? }` → `BankTransaction[]`
- `src/tools/reconcile.ts` — `{ invoices, transactions }` → `ReconciliationReport`
- `src/tools/get-unmatched.ts` — `{ reportId }` → `{ invoices, transactions }`
- `src/__tests__/server.test.ts`

Każdy tool: 5-15 linii. Parse input z Zod → delegate do Ksefnik facade → return JSON.

---

## T10.2 — Remaining 4 Tools & Package Entry {#t102}

**Pliki:**
- `src/tools/query-invoices.ts` — filter by NIP, amount, date
- `src/tools/send-invoice.ts` — `{ invoice }` → `{ ksefReference }`
- `src/tools/confirm-match.ts` — `{ matchId, confirmed }` → `{ success }`
- `src/tools/validate-invoice.ts` — `{ invoice }` → `{ valid, errors }`
- `src/tools/index.ts`
- `src/index.ts` — barrel: `createMcpServer`
- `src/__tests__/tools.test.ts`
