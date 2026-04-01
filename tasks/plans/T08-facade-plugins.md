# T08 — @ksefnik/core: Facade, Plugins & Package Entry

**Dependencies**: T04, T05, T06, T07
**Lokalizacja**: `packages/core/src/`

---

## T08.1 — Plugin System {#t081}

**Pliki:**
- `src/plugins/loader.ts` — `loadPlugin(name): Promise<KsefPlugin | null>` via dynamic import + try/catch
- `src/plugins/registry.ts` — register, list, getPasses(), getValidators()
- `src/plugins/index.ts`
- `src/__tests__/plugins/registry.test.ts`

Loader: `try { await import(name) } catch { return null }`.
Registry: merguje passy (core 100-500 + plugin 600+), parsery, validators.

---

## T08.2 — Ksefnik Facade {#t082}

**Pliki:**
- `src/ksefnik.ts` — Ksefnik class z namespace'ami: invoices, bank, reconciliation, plugins
- `src/index.ts` — `createKsefnik(config)` factory + re-exports z shared
- `src/__tests__/ksefnik.test.ts`

**Public API (musi matchować docs/architecture.md):**
```typescript
const ksef = createKsefnik({ nip, environment, token, adapter?, storage? })

ksef.invoices.fetch({ dateFrom, dateTo })
ksef.invoices.send(invoice)
ksef.bank.import(filePath, opts?)
ksef.reconciliation.run({ invoices, transactions })
ksef.reconciliation.runFromFiles({ ksefOpts, bankFile })  // convenience
ksef.plugins.register(plugin)
```

---

## T08.3 — Barrel Exports & Integration Tests {#t083}

**Pliki:**
- Zaktualizuj `src/index.ts` — wszystkie publiczne eksporty
- `src/__tests__/index.test.ts` — sprawdź że wszystkie oczekiwane symbole są wyeksportowane
- `src/__tests__/facade.integration.test.ts` — E2E: create instance z mock adapter, import bank file z fixture, run reconciliation, verify report

**Walidacja**: `pnpm test`, `pnpm typecheck`, `pnpm build` na core package.
