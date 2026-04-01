# T12 — Integration Tests, Examples & Build

**Dependencies**: T09, T10, T11
**Lokalizacja**: `tests/integration/`, `examples/`, `apps/build/`

---

## T12.1 — End-to-End Integration Tests {#t121}

**Pliki:**
- `tests/integration/full-reconciliation.test.ts` — simulator + bank fixture + reconciliation → verify report
- `tests/integration/mcp-server.test.ts` — spawn MCP, send tool calls, verify responses
- `tests/integration/cli-smoke.test.ts` — spawn CLI, check exit codes + output

**Scenariusz full-reconciliation:**
1. createKsefSimulator('happy-path') z 10 fakturami
2. Import bank fixture z 15 transakcjami (10 matchujących + 5 nie)
3. Run reconciliation
4. Assert: 10 matched, 0 unmatched invoices, 5 unmatched transactions
5. Assert: confidence scores poprawne, pass breakdown poprawny

---

## T12.2 — Demo Example & Documentation {#t122}

**Pliki:**
- `examples/demo/index.ts` — 15-20 linii: "aha moment" z simulator
- `examples/demo/package.json`
- `examples/demo/README.md`
- `docs/getting-started.md` (EN)
- `docs/api-reference.md` (EN)

Demo musi działać z jedną komendą: `npx tsx examples/demo/index.ts`

---

## T12.3 — Build Pipeline & Binary Compilation {#t123}

**Pliki:**
- `apps/build/build.ts` — bun build --compile dla CLI binary
- `apps/build/package.json`
- Root `package.json` — dodaj script `build:binary`
- `.github/workflows/ci.yml` — pnpm install, typecheck, test, build
- `.github/workflows/release.yml` — npm publish on tag

**Walidacja**: CI przechodzi, binary się kompiluje, `./ksefnik --version` działa.
