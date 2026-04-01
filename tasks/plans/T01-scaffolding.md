# T01 — Monorepo Scaffolding & Configuration

**Dependencies**: Brak (pierwszy task)
**Source of truth**: docs/architecture.md, CLAUDE.md

---

## T01.1 — Root Configuration Files {#t011} ✅

Stwórz root monorepo z konfiguracją.

**Pliki do stworzenia:**
- `.nvmrc` → `22`
- `package.json` — root workspace:
  - `"private": true`
  - Scripts: `dev`, `build`, `test`, `typecheck`, `format`
  - `pnpm -r` do uruchamiania across packages
- `pnpm-workspace.yaml` → `packages: ["packages/*", "apps/*"]`
- `tsconfig.base.json`:
  - `strict: true`, `noUncheckedIndexedAccess: true`
  - `module: "NodeNext"`, `moduleResolution: "NodeNext"`
  - `target: "ES2022"`, `composite: true`
  - paths: `"@ksefnik/*": ["./packages/*/src"]`
- `.prettierrc` → `{ singleQuote: true, semi: false, trailingComma: "all", printWidth: 100 }`
- `.prettierignore` → `dist, node_modules, coverage`
- `.gitignore` → `node_modules, dist, .turbo, coverage, *.sqlite, .DS_Store`
- `vitest.workspace.ts` → glob `packages/*/vitest.config.ts`
- `LICENSE` → MIT

**Walidacja**: `pnpm install` działa bez błędów, `pnpm typecheck` przechodzi (puste pakiety).

---

## T01.2 — Package Shells: shared + core {#t012} ✅

**Pliki do stworzenia (per pakiet):**

`packages/shared/`:
- `package.json` → name: `@ksefnik/shared`, deps: `zod`, exports: `./dist/index.js`
- `tsconfig.json` → extends `../../tsconfig.base.json`, composite
- `vitest.config.ts`
- `src/index.ts` → pusty barrel

`packages/core/`:
- `package.json` → name: `@ksefnik/core`, deps: `@ksefnik/shared`, `zod`, `mt940js`, `fuzzball`
- `tsconfig.json`, `vitest.config.ts`
- `src/index.ts` → pusty barrel

**Walidacja**: `pnpm install` + `pnpm build` przechodzi na pustych pakietach.

---

## T01.3 — Package Shells: simulator, mcp, cli {#t013}

`packages/simulator/`:
- `package.json` → name: `@ksefnik/simulator`, deps: `@ksefnik/shared`, `@ksefnik/core`
- `tsconfig.json`, `vitest.config.ts`, `src/index.ts`

`packages/mcp/`:
- `package.json` → deps: `@ksefnik/core`, `@modelcontextprotocol/sdk`
- `tsconfig.json`, `vitest.config.ts`, `src/index.ts`

`packages/cli/`:
- `package.json` → deps: `@ksefnik/core`, `@ksefnik/mcp`, `commander`, `@clack/prompts`
- `bin` field: `{ "ksefnik": "./dist/main.js" }`
- `tsconfig.json`, `vitest.config.ts`, `src/index.ts`

`apps/build/`:
- `package.json` → placeholder for bun compile

**Walidacja**: `pnpm install`, `pnpm build`, `pnpm typecheck` — wszystko zielone.

---

## T01.4 — Test Fixtures & Directories {#t014}

**Pliki do stworzenia:**
- `tests/fixtures/mt940/sample.mt940` — valid MT940 z 5-10 transakcjami (PLN, polskie banki)
- `tests/fixtures/csv/mbank-sample.csv` — format mBank (Windows-1250 lub UTF-8, polskie nagłówki)
- `tests/fixtures/csv/ing-sample.csv` — format ING
- `tests/fixtures/csv/pko-sample.csv` — format PKO BP
- `tests/fixtures/csv/santander-sample.csv` — format Santander
- `tests/fixtures/xml/invoice-simple.xml` — FA(3) KSeF XML, 1 pozycja
- `tests/fixtures/xml/invoice-multi-line.xml` — FA(3) KSeF XML, 3 pozycje
- `tests/fixtures/xml/invoice-invalid-nip.xml` — nieprawidłowy NIP
- `tests/fixtures/README.md` — opis konwencji fixture'ów

**Ważne**: Fixture'y muszą odzwierciedlać realne formaty polskich banków. Sprawdź przez Context7 specyfikację MT940 i formaty CSV dla każdego banku.

**Walidacja**: Pliki fixture'ów istnieją i zawierają realistyczne dane.
