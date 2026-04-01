# T09 — @ksefnik/simulator

**Dependencies**: T08
**Lokalizacja**: `packages/simulator/src/`

---

## T09.1 — Mock Adapter & Scenario Infrastructure {#t091} ✅

**Pliki:**
- `src/adapter.ts` — MockKsefAdapter implements KsefAdapter
- `src/invoice-store.ts` — in-memory store for mock invoices
- `src/types.ts` — SimulatorConfig, ScenarioName type
- `src/__tests__/adapter.test.ts`

MockKsefAdapter zwraca canned responses na podstawie scenario. Store trzyma mock invoices.

---

## T09.2 — 5 Scenarios & Factory {#t092} ✅

**Pliki:**
- `src/scenarios/happy-path.ts` — all ops succeed instantly
- `src/scenarios/timeout.ts` — 10s delay, timeout after 30s
- `src/scenarios/invalid-nip.ts` — KsefApiError na NIP validation
- `src/scenarios/session-expired.ts` — token valid 1 request, then KsefSessionError
- `src/scenarios/upo-delay.ts` — UPO pending on first call, success on second
- `src/scenarios/index.ts`
- `src/index.ts` — `createKsefSimulator({ scenario, invoices? })` → `{ adapter, store }`
- `src/__tests__/scenarios.test.ts`

**Walidacja**: Każdy scenariusz testowany: happy path działa, timeout rzuca, itd.
