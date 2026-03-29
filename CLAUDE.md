# KSeF Sync — TypeScript SDK

## Project Overview

Open-source TypeScript SDK for KSeF (Polish National e-Invoice System) reconciliation.
Core value: matching KSeF invoices with bank statement transactions.

**Organization**: CodeFormers-it
**Repo**: CodeFormers-it/ksef-sync (private → public when ready)
**Sister repo**: CodeFormers-it/ksef-sync-pro (always private)

## Tech Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript (strict) |
| Runtime | Node.js 22 |
| Package Manager | pnpm (workspace monorepo) |
| Validation | Zod |
| Testing | Vitest |
| KSeF API client | @ksef/client (adapter pattern) |
| MCP SDK | @modelcontextprotocol/sdk |
| CLI | Commander.js |
| Interactive | @clack/prompts |
| Fuzzy matching | fuzzball |
| MT940 parsing | mt940js |
| DB (local) | bun:sqlite |
| Binary | bun build --compile |

## Monorepo Structure

```
packages/
  shared/        @ksef-sync/shared    — Zod schemas, types, plugin interface
  core/          @ksef-sync/core      — SDK facade, reconciliation engine, bank parsers
  simulator/     @ksef-sync/simulator — Offline KSeF mock server
  mcp/           @ksef-sync/mcp       — MCP server (thin wrapper on core)

apps/
  cli/           @ksef-sync/cli       — CLI entry point → standalone binary
```

## Key Conventions

- **pnpm workspace** with `apps/*` and `packages/*` (same as codeformers-website)
- **SDK-first**: all logic lives in `@ksef-sync/core`. CLI, MCP, and hosted API are thin wrappers.
- **Plugin system**: pro features loaded via `try { await import(pkg) } catch {}` — missing = free tier.
- **No DRM**: zero license validation in runtime, zero phone-home.
- **Zod everywhere**: all domain models (Invoice, BankTransaction, Match) are Zod schemas.
- **Money as integers**: amounts in grosze (1 PLN = 100), never floats.
- **Adapter pattern**: @ksef/client wrapped in adapter for retry, cache, swappability.
- **.nvmrc**: 22
- **Formatting**: Prettier (no ESLint in root)

## Architecture Principles

- `KsefSync` facade with namespaces: `invoices`, `bank`, `reconciliation`, `plugins`
- Reconciliation engine: 6-pass pipeline (KSeF ref → exact NIP → invoice ref → fuzzy → partial → proximity)
- Each pass implements `ReconciliationPass` interface with `order` number (core: 50-500, plugins: 600+)
- Bank parsers implement `BankStatementParser` protocol with auto-detection

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in watch mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run Vitest |
| `pnpm typecheck` | Type-check all packages |

## What NOT to do

- Don't add fetch/send KSeF as standalone value — it's commodity
- Don't build a web dashboard — buyer is a developer, not a bookkeeper
- Don't add Google Drive / storage integrations — not our problem
- Don't implement all 87 validation rules — do top 20 max
- Don't use Turborepo yet — overkill for 4-5 packages
