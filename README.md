<p align="center">
  <a href="https://codeformers.it/">
    <img src="codeformers-github.png" alt="CodeFormers.it" width="420" />
  </a>
</p>

<h1 align="center">KSeF Sync</h1>

<p align="center">
  TypeScript SDK do reconcyliacji faktur z Krajowego Systemu e-Faktur (KSeF) z wyciagami bankowymi.
  <br />
  Darmowe i otwarte narzedzie dla polskich deweloperow.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## O projekcie

KSeF Sync to otwarte narzedzie stworzone przez [CodeFormers.it](https://codeformers.it/) dla polskich deweloperow i zespolow finansowych. Automatyzuje dopasowywanie faktur pobranych z KSeF do transakcji na wyciagach bankowych. SDK zapewnia pelna kontrole nad procesem reconcyliacji -- od importu danych, przez wieloetapowe dopasowywanie, az po raportowanie rozbieznosci.

Projekt jest na wczesnym etapie rozwoju. API moze sie zmieniac miedzy wersjami.

## Funkcje

### Reconciliation Engine

Automatyczne dopasowywanie faktur KSeF do przelewow bankowych w 6 krokach: numer KSeF, dokladne dopasowanie NIP + kwota, numer faktury w tytule przelewu, przyblizone dopasowanie nazwy (fuzzy matching), platnosci czesciowe, dopasowanie bliskosci.

### Bank Parsers

Import wyciagow z polskich bankow: MT940 (standard), CSV z mBank, ING, PKO BP, Santander. Automatyczna detekcja formatu pliku. Ekstrakcja NIP z tytulow przelewow.

### KSeF Simulator

Lokalny mock serwer KSeF do testow offline. Deterministyczny, bez polaczenia z Ministerstwem Finansow. Gotowe scenariusze: happy-path, timeout, odrzucenie faktury, wygasniecie sesji.

### MCP Server

Model Context Protocol server (8 narzedzi) do integracji z Claude i innymi asystentami AI. Reconcyliacja, import wyciagow i zapytania o faktury bezposrednio z poziomu AI.

### Walidacja faktur

Walidacja faktur przed wyslaniem do KSeF. Reguly biznesowe Ministerstwa Finansow z czytelnymi komunikatami bledow po polsku.

### Type-Safe SDK

Pelne typy TypeScript wygenerowane z oficjalnych schematow XSD KSeF. Bledy wychwytywane na etapie kompilacji, a nie w runtime.

## Instalacja

**Wymagania**: Node.js 22+, pnpm 9+

```bash
npm install @ksef-sync/core
# lub
pnpm add @ksef-sync/core
```

Jesli potrzebujesz symulatora KSeF do testow:

```bash
npm install --save-dev @ksef-sync/simulator
```

## Szybki start

```typescript
import { createKsefSync } from '@ksef-sync/core'

const ksef = createKsefSync({
  nip: '1234567890',
  environment: 'test',
  token: process.env.KSEF_TOKEN
})

// Pobierz faktury z KSeF
const invoices = await ksef.invoices.fetch({
  dateFrom: '2026-03-01',
  dateTo: '2026-03-31'
})

// Zaimportuj wyciag bankowy
const transactions = await ksef.bank.import('./wyciag.mt940')

// Uruchom reconcyliacje
const report = await ksef.reconciliation.run({ invoices, transactions })

console.log(`Dopasowane: ${report.matched.length}`)
console.log(`Niedopasowane faktury: ${report.unmatchedInvoices.length}`)
console.log(`Niedopasowane przelewy: ${report.unmatchedTransactions.length}`)
```

## Architektura

KSeF Sync stosuje podejscie SDK-first -- cala logika biznesowa znajduje sie w pakiecie `core`, a pozostale pakiety (CLI, MCP server) sa cienkimi wrapperami, ktore z niego korzystaja.

```
ksef-sync/
  packages/
    shared/       @ksef-sync/shared      Typy Zod, interfejsy, plugin system
    core/         @ksef-sync/core        Reconciliation engine, bank parsers, KSeF adapter
    simulator/    @ksef-sync/simulator   Offline KSeF test harness
    mcp/          @ksef-sync/mcp         MCP server (wrapper na core)
    cli/          @ksef-sync/cli         CLI (Commander.js), standalone binary via bun compile
```

| Pakiet | Opis |
|--------|------|
| `@ksef-sync/shared` | Wspoldzielone typy Zod, interfejsy i plugin system |
| `@ksef-sync/core` | Glowna logika: reconciliation engine, bank parsers, adapter KSeF |
| `@ksef-sync/simulator` | Lokalny mock serwer KSeF do testow offline |
| `@ksef-sync/mcp` | Model Context Protocol server -- integracja z AI |
| `@ksef-sync/cli` | Interfejs wiersza polecen, kompilacja do standalone binary |

## MCP Server

MCP server umozliwia korzystanie z KSeF Sync bezposrednio z Claude Desktop lub dowolnego klienta obslugujacego Model Context Protocol.

### Konfiguracja Claude Desktop

Dodaj ponizszy wpis do pliku konfiguracyjnego Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ksef-sync": {
      "command": "ksef-sync",
      "args": ["mcp"]
    }
  }
}
```

Serwer udostepnia 8 narzedzi obejmujacych reconcyliacje, import wyciagow bankowych oraz zapytania o faktury.

### Uruchomienie reczne

```bash
npx @ksef-sync/cli mcp
```

## Stack technologiczny

| Technologia | Zastosowanie |
|-------------|-------------|
| TypeScript (strict) | Jezyk programowania |
| Node.js 22 | Srodowisko uruchomieniowe |
| pnpm | Menedzer pakietow, workspace monorepo |
| Zod | Walidacja danych i definicja schematow |
| Vitest | Framework testowy |
| Commander.js | CLI framework |
| @clack/prompts | Interaktywne prompty CLI |
| @modelcontextprotocol/sdk | Implementacja MCP server |
| fuzzball | Fuzzy string matching |
| mt940js | Parser formatu MT940 |
| bun | Kompilacja CLI do standalone binary |

## Rozwoj

### Uruchomienie lokalne

```bash
git clone https://github.com/CodeFormers-it/ksef-sync.git
cd ksef-sync
pnpm install
pnpm build
```

### Testy

```bash
pnpm test           # uruchom wszystkie testy
pnpm test:watch     # tryb watch
```

### Wytyczne dla Pull Requestow

1. Stworz branch z opisowa nazwa (`feat/partial-payments`, `fix/mt940-parser`).
2. Upewnij sie, ze wszystkie testy przechodza (`pnpm test`).
3. Dodaj testy dla nowej funkcjonalnosci.
4. Opisz zmiany w PR -- co, dlaczego i jak przetestowac.

Zapraszamy do zglaszania Issues i Pull Requestow. Projekt jest na wczesnym etapie, wiec kazdego rodzaju wklad jest mile widziany.

## Licencja

MIT -- darmowe dla wszystkich, do dowolnego zastosowania.

Szczegoly w pliku [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://codeformers.it/">
    <img src="codeformers-github.png" alt="CodeFormers.it" width="280" />
  </a>
</p>

<p align="center">
  Stworzone przez <a href="https://codeformers.it/">CodeFormers.it</a> -- software house specjalizujacy sie w TypeScript, automatyzacji i integracji systemow.
  <br /><br />
  <a href="https://codeformers.it/">codeformers.it</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://codeformers.it/calculator/project-estimator/">Wycen projekt w 60 sekund</a>
</p>
