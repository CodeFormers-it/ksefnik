# T11 — @ksefnik/cli

**Dependencies**: T08, T10
**Lokalizacja**: `packages/cli/src/`
**Context7**: Sprawdź commander.js i @clack/prompts docs

---

## T11.1 — CLI Framework & Commands: fetch, send {#t111} ✅

**Pliki:**
- `src/main.ts` — Commander.js program, global options: --nip, --env, --token, --debug
- `src/commands/fetch.ts` — `ksefnik fetch --from --to [--format json|csv|table]`
- `src/commands/send.ts` — `ksefnik send <filePath> [--format json|text]`
- `src/utils/output.ts` — table/JSON/CSV formatters
- `src/utils/config.ts` — reads env vars, .ksefnikrc
- `src/__tests__/commands/fetch.test.ts`
- `src/__tests__/commands/send.test.ts`

---

## T11.2 — Commands: bank, reconcile, validate {#t112} ✅

**Pliki:**
- `src/commands/bank.ts` — `ksefnik bank import <file> [--format auto|mt940|csv]`
- `src/commands/reconcile.ts` — `ksefnik reconcile --bank <file> [--ksef-from --ksef-to]`
- `src/commands/validate.ts` — `ksefnik validate <file>` — wypisz błędy po polsku
- `src/__tests__/commands/bank.test.ts`
- `src/__tests__/commands/reconcile.test.ts`
- `src/__tests__/commands/validate.test.ts`

---

## T11.3 — Command: mcp, Interactive Mode & CLI Entry {#t113}

**Pliki:**
- `src/commands/mcp.ts` — `ksefnik mcp [--stdio]` — uruchom MCP server
- `src/interactive/guided-reconcile.ts` — @clack/prompts: wybierz operację → configure → execute
- `src/interactive/index.ts`
- `src/index.ts` — barrel + bin entry
- `src/__tests__/commands/mcp.test.ts`
