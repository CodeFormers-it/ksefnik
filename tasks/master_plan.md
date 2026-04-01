# Ksefnik — Master Implementation Plan

> Wygenerowano: 2026-04-01
> Scope: Cała architektura ksefnik (public repo, MIT)
> Status: 0% implemented — greenfield

## Reguły realizacji

1. Każde zadanie realizujemy z użyciem dostępnych agentów (/agency-orchestrator)
2. Przed implementacją czytamy dokumentację przez Context7, jeśli dotyczy zewnętrznej biblioteki lub API
3. Po wykonaniu każdego tasku — weryfikacja poprawności (testy, linting, manual check)
4. Po pozytywnej walidacji — zaproponuj nazwę commita i wyświetl pytanie: "Czy zacommitować? (y/n)"
5. Checkbox `- [x]` odznaczamy dopiero po POMYŚLNEJ walidacji
6. Pliki źródłowe: docs/architecture.md (source of truth), CLAUDE.md (konwencje)

## Dependency Graph

```
T01 → T02 → ┬→ T03 → T04 ──┐
             ├→ T05 ─────────┤→ T07 → T08 → T09 → T10 → T11 → T12
             └→ T06 ─────────┘
```

Parallelizm: po T02 — T03+T04, T05, T06 mogą biec równolegle.

---

## Tasks

- [x] **T01 — Monorepo Scaffolding & Configuration** (4 subtaski)
  - [x] [T01.1 — Root config files](./plans/T01-scaffolding.md#t011)
  - [x] [T01.2 — Package shells: shared + core](./plans/T01-scaffolding.md#t012)
  - [x] [T01.3 — Package shells: simulator, mcp, cli](./plans/T01-scaffolding.md#t013)
  - [x] [T01.4 — Test fixtures & directories](./plans/T01-scaffolding.md#t014)

- [x] **T02 — @ksefnik/shared** (4 subtaski)
  - [x] [T02.1 — Zod schemas: Invoice & BankTransaction](./plans/T02-shared.md#t021)
  - [x] [T02.2 — Zod schemas: Match & ReconciliationReport](./plans/T02-shared.md#t022)
  - [x] [T02.3 — Type interfaces: Plugin, Pass, Parser, Adapter, Storage, Config](./plans/T02-shared.md#t023)
  - [x] [T02.4 — Typed errors & barrel export](./plans/T02-shared.md#t024)

- [x] **T03 — @ksefnik/core: Storage Layer** (2 subtaski)
  - [x] [T03.1 — In-memory storage](./plans/T03-storage.md#t031)
  - [x] [T03.2 — SQLite storage (bun:sqlite / better-sqlite3)](./plans/T03-storage.md#t032)

- [x] **T04 — @ksefnik/core: KSeF Adapter** (3 subtaski)
  - [x] [T04.1 — Adapter implementation (wraps @ksef/client)](./plans/T04-ksef-adapter.md#t041)
  - [x] [T04.2 — Retry & exponential backoff](./plans/T04-ksef-adapter.md#t042)
  - [x] [T04.3 — Cache (TTL) & session management](./plans/T04-ksef-adapter.md#t043)

- [x] **T05 — @ksefnik/core: Bank Parsers & NIP Extraction** (4 subtaski)
  - [x] [T05.1 — NIP extractor & auto-detect](./plans/T05-bank-parsers.md#t051)
  - [x] [T05.2 — MT940 parser](./plans/T05-bank-parsers.md#t052)
  - [x] [T05.3 — CSV parsers: mBank + ING](./plans/T05-bank-parsers.md#t053)
  - [x] [T05.4 — CSV parsers: PKO + Santander & parser registry](./plans/T05-bank-parsers.md#t054)

- [x] **T06 — @ksefnik/core: Validation Engine** (2 subtaski)
  - [x] [T06.1 — Framework & first 10 rules](./plans/T06-validation.md#t061)
  - [x] [T06.2 — Remaining 10 rules & validation index](./plans/T06-validation.md#t062)

- [x] **T07 — @ksefnik/core: Reconciliation Engine** (5 subtasków)
  - [x] [T07.1 — Pipeline infrastructure & scoring](./plans/T07-reconciliation.md#t071)
  - [x] [T07.2 — Pass 100 (ksef-ref) & Pass 200 (exact)](./plans/T07-reconciliation.md#t072)
  - [x] [T07.3 — Pass 300 (invoice-ref) & Pass 400 (fuzzy)](./plans/T07-reconciliation.md#t073)
  - [x] [T07.4 — Pass 450 (partial) & Pass 500 (proximity)](./plans/T07-reconciliation.md#t074)
  - [x] [T07.5 — Pass registry & pipeline integration tests](./plans/T07-reconciliation.md#t075)

- [x] **T08 — @ksefnik/core: Facade, Plugins & Package Entry** (3 subtaski)
  - [x] [T08.1 — Plugin system (loader + registry)](./plans/T08-facade-plugins.md#t081)
  - [x] [T08.2 — Ksefnik facade class + createKsefnik() factory](./plans/T08-facade-plugins.md#t082)
  - [x] [T08.3 — Core barrel exports & facade integration tests](./plans/T08-facade-plugins.md#t083)

- [x] **T09 — @ksefnik/simulator** (2 subtaski)
  - [x] [T09.1 — Mock adapter & scenario infrastructure](./plans/T09-simulator.md#t091)
  - [x] [T09.2 — 5 scenarios & createKsefSimulator() factory](./plans/T09-simulator.md#t092)

- [x] **T10 — @ksefnik/mcp** (2 subtaski)
  - [x] [T10.1 — MCP server factory & first 4 tools](./plans/T10-mcp.md#t101)
  - [x] [T10.2 — Remaining 4 tools & package entry](./plans/T10-mcp.md#t102)

- [x] **T11 — @ksefnik/cli** (3 subtaski)
  - [x] [T11.1 — CLI framework & commands: fetch, send](./plans/T11-cli.md#t111)
  - [x] [T11.2 — Commands: bank, reconcile, validate](./plans/T11-cli.md#t112)
  - [x] [T11.3 — Command: mcp, interactive mode & CLI entry](./plans/T11-cli.md#t113)

- [x] **T12 — Integration Tests, Examples & Build** (3 subtaski)
  - [x] [T12.1 — End-to-end integration tests](./plans/T12-integration.md#t121)
  - [x] [T12.2 — Demo example & documentation](./plans/T12-integration.md#t122)
  - [x] [T12.3 — Build pipeline & binary compilation](./plans/T12-integration.md#t123)
