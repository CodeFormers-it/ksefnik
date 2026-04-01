# T03 — @ksefnik/core: Storage Layer

**Dependencies**: T02
**Lokalizacja**: `packages/core/src/storage/`

---

## T03.1 — In-Memory Storage {#t031} ✅

**Pliki:**
- `src/storage/in-memory.storage.ts`
- `src/storage/index.ts`
- `src/__tests__/storage/in-memory.storage.test.ts`

Implementuje `Storage` z shared. Wewnętrznie `Map<string, T>`. Obsługuje filtrowanie po dacie, NIP, kwocie. Default storage gdy nic innego nie skonfigurowano.

**Testy**: CRUD invoices + transactions + reports, query filtering.

---

## T03.2 — SQLite Storage {#t032} ✅

**Pliki:**
- `src/storage/sqlite.storage.ts`
- `src/__tests__/storage/sqlite.storage.test.ts`

Używa `better-sqlite3` (z dynamic import wrapper próbującym `bun:sqlite` najpierw).
Tabele: `invoices`, `bank_transactions`, `matches`, `reconciliation_reports`.
Złożone pola jako JSON. Auto-migracja przy pierwszym connect.
Testy na `:memory:` database.

**Walidacja**: Testy przechodzą, dane persystują między operacjami.
