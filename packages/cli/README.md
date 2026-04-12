# @ksefnik/cli — KSeF CLI dla TypeScript / Node.js (z MCP serverem dla Claude)

**Wiersz poleceń do Krajowego Systemu e-Faktur (KSeF 2.0)** — pobieranie faktur, import wyciągów bankowych (MT940, mBank, ING, PKO BP, Santander), reconcyliacja faktur z przelewami, walidacja przed wysyłką i uruchamianie serwera **Model Context Protocol** dla Claude Desktop i Cursora. Część [Ksefnika](https://ksefnik.pl/) — otwartego **KSeF SDK w TypeScript / Node.js**. Jeden komfortowy binarny interfejs dla developerów, zespołów fintech, automatyzacji w CI / cron i agentów AI.

Znany również jako: *KSeF CLI*, *ksef command line*, *e-faktura CLI*, *Polish e-Invoice CLI*, *KSeF MCP launcher*. [Dokumentacja CLI →](https://docs.ksefnik.pl/cli/przeglad/)

```bash
npx @ksefnik/cli --help
```

## Instalacja

```bash
# globalnie
npm install -g @ksefnik/cli

# albo jednorazowo, bez instalacji
npx @ksefnik/cli <komenda>
```

Wymaga **Node.js 22+**.

## Konfiguracja

CLI czyta parametry z trzech miejsc (priorytet od najwyższego):

1. **flagi** na linii komend — `--nip`, `--env`, `--token`, `--public-key`
2. **zmienne środowiskowe** — `KSEF_NIP`, `KSEF_TOKEN`, `KSEFNIK_ENV`, `KSEFNIK_ADAPTER`, `KSEF_PUBLIC_KEY_PATH`
3. **plik `.env`** w bieżącym katalogu (przez `--env-file`)

Rekomendowane — `.env` w katalogu projektu:

```bash
# .env
KSEF_NIP=7010002137
KSEF_TOKEN=twój-token-z-portalu-MF
KSEFNIK_ENV=production        # production | demo | test
KSEFNIK_ADAPTER=http          # http (produkcja) | simulator (testy)
KSEF_PUBLIC_KEY_PATH=./mf-public.pem
```

**Środowiska KSeF**:

| `--env` | Bazowy URL |
|---|---|
| `production` | `https://api.ksef.mf.gov.pl/v2` |
| `demo` | `https://api-demo.ksef.mf.gov.pl/v2` |
| `test` | `https://api-test.ksef.mf.gov.pl/v2` |

Domyślnie `test` — czyli CLI z nieskonfigurowanym środowiskiem **nie wyśle Ci nic przypadkiem na produkcję**. Żeby ruszyć produkcję, musisz świadomie ustawić `KSEFNIK_ENV=production`.

## Komendy

### `ksefnik fetch` — pobierz faktury z KSeF

```bash
ksefnik fetch --from 2026-03-01 --to 2026-03-31 --format table
```

| Flaga | Opis |
|---|---|
| `--from <date>` | Data początkowa (`YYYY-MM-DD`), wymagane |
| `--to <date>` | Data końcowa (`YYYY-MM-DD`), wymagane |
| `--format <fmt>` | `json` (default) albo `table` |

Pod spodem woła `ksef.invoices.fetch()` z `@ksefnik/core` przez adapter HTTP. Obsługuje retry, 429, refresh tokenów, cache klucza publicznego MF.

### `ksefnik bank import <plik>` — zaimportuj wyciąg bankowy

```bash
ksefnik bank import ./wyciag.mt940
ksefnik bank import ./export-mbank.csv --format table
```

Auto-detekcja formatu: **MT940**, **mBank CSV**, **ING CSV**, **PKO BP CSV**, **Santander CSV**. Wypisuje liczbę wczytanych transakcji i zrzuca je w wybranym formacie. Kwoty są normalizowane do groszy (int) — jeżeli widzisz `123.45`, to jest to `12345` groszy pod spodem.

### `ksefnik reconcile --bank <plik>` — odpal reconcyliację

```bash
ksefnik reconcile --bank ./wyciag.mt940 --format table
```

Uruchamia 6-stopniowy pipeline z `@ksefnik/core`:

1. referencja KSeF w tytule przelewu
2. NIP + dokładna kwota
3. numer faktury w tytule
4. fuzzy matching nazwy kontrahenta
5. płatności częściowe
6. proximity (NIP + kwota ±tolerancja + data ±N dni)

Na wyjściu dostajesz pełny raport: dopasowane (z `score` i `strategy`), niedopasowane faktury, niedopasowane przelewy, średnią pewność. W `--format table` od razu czytelnie w terminalu, w `--format json` gotowe do wpięcia w pipeline w CI / GitHub Actions / cron.

### `ksefnik validate <plik>` — zwaliduj fakturę(y) przed wysłaniem

```bash
ksefnik validate ./faktura.json
ksefnik validate ./faktury.json --format table
```

Wczytuje pojedynczą fakturę albo tablicę faktur z pliku JSON, odpala **wszystkie** reguły walidacji z `@ksefnik/core` i raportuje. Każdy błąd ma kod, severity i human-readable message po polsku — nadaje się bezpośrednio do wyświetlenia użytkownikowi. Do użycia jako pre-send gate przed `ksefnik send`.

Testowane reguły obejmują m.in.: format NIP (sprzedawca + nabywca), poprawność waluty (ISO 4217), dodatnie kwoty, spójność netto+VAT=brutto, kolejność dat, poprawne stawki VAT (PL: 0/5/8/23/zw/np/oo), duplikaty, długość opisów, format numeru faktury.

### `ksefnik send <plik.xml>` — wyślij fakturę do KSeF

```bash
ksefnik send ./faktura.xml
```

> **MVP**: `sendInvoice` w `@ksefnik/http` jest w tym momencie stubem. Komenda wywoła adapter, ale na realny KSeF wrzuci rzut `"not implemented"`. W pełnym asynchronicznym flow (`POST /invoices/exports` + polling + UPO) wejdzie w v0.1.

### `ksefnik mcp` — uruchom serwer MCP dla Claude

> Pelna konfiguracja MCP: [docs.ksefnik.pl/mcp/konfiguracja](https://docs.ksefnik.pl/mcp/konfiguracja/)

```bash
ksefnik mcp
```

To jest ta komenda, której używa Twoja konfiguracja Claude Desktop w `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ksefnik": {
      "command": "npx",
      "args": ["-y", "@ksefnik/cli", "mcp"],
      "env": {
        "KSEF_NIP": "7010002137",
        "KSEF_TOKEN": "...",
        "KSEFNIK_ENV": "production",
        "KSEF_PUBLIC_KEY_PATH": "/abs/path/do/mf-public.pem"
      }
    }
  }
}
```

Serwer używa `StdioServerTransport` z oficjalnego `@modelcontextprotocol/sdk` i wystawia 9 narzędzi (sync-invoices, query-invoices, import-bank, reconcile, get-unmatched, confirm-match, validate-invoice, send-invoice, get-upo). Szczegóły w [`@ksefnik/mcp`](../mcp).

## Flagi globalne

Wszystkie komendy akceptują flagi globalne programu:

| Flaga | Opis |
|---|---|
| `--nip <nip>` | NIP firmy (nadpisuje `KSEF_NIP`) |
| `--env <env>` | `production` / `demo` / `test` (nadpisuje `KSEFNIK_ENV`) |
| `--token <token>` | Token KSeF (nadpisuje `KSEF_TOKEN`) |
| `--adapter <kind>` | `http` (default) / `simulator` (offline, do testów) |
| `--public-key <pathOrPem>` | Ścieżka do PEM klucza publicznego MF albo PEM inline |
| `--debug` | Rozszerzone logi (m.in. żądania HTTP, retry, stan sesji) |

## Scenariusze użycia

### Codzienna reconcyliacja w cronie

```bash
#!/usr/bin/env bash
set -euo pipefail

export KSEF_NIP=7010002137
export KSEF_TOKEN="$(op read 'op://vault/ksef/token')"   # np. 1Password CLI
export KSEFNIK_ENV=production
export KSEF_PUBLIC_KEY_PATH=/etc/ksefnik/mf-public.pem

# 1. Pobierz wczorajsze faktury kosztowe
ksefnik fetch --from "$(date -v-1d +%F)" --to "$(date -v-1d +%F)" > /tmp/invoices.json

# 2. Ściągnij wyciąg z bankiera (np. przez ich API albo scp)
# ...

# 3. Reconcyliacja
ksefnik reconcile --bank /tmp/wyciag.mt940 --format json > /tmp/report.json

# 4. Wyślij raport na Slack, do Linear, do bazy, gdziekolwiek
```

### CI pipeline — walidacja faktur przed wysłaniem

```yaml
# .github/workflows/validate.yml
- run: npx @ksefnik/cli validate ./invoices/*.json --format json
```

### Testowanie offline z simulatorem

```bash
KSEFNIK_ADAPTER=simulator ksefnik fetch --from 2026-03-01 --to 2026-03-31
```

Zero requestów do produkcji, zero potrzeby tokenu — pipeline wciąż ten sam.

## Kompilacja do standalone binary

Dla dystrybucji bez `node_modules`:

```bash
pnpm --filter @ksefnik/cli build
bun build --compile ./apps/build/dist/main.js --outfile ksefnik
./ksefnik --help
```

Efekt: pojedynczy plik wykonywalny, bez potrzeby instalowania Node.js na maszynie docelowej. Przydaje się, kiedy wrzucasz Ksefnika do firmowego image'u Dockerowego albo do niestandardowego środowiska, gdzie nie chcesz ciągnąć npm.

## Powiązane pakiety

- [`@ksefnik/core`](../core) — silnik, który CLI opakowuje
- [`@ksefnik/http`](../http) — produkcyjny adapter HTTP
- [`@ksefnik/simulator`](../simulator) — mock do trybu offline
- [`@ksefnik/mcp`](../mcp) — serwer MCP uruchamiany komendą `ksefnik mcp`

## Licencja

MIT. Część monorepo [ksefnik](../../README.md). Ksefnik jest rozwijany przez [CodeFormers.it](https://codeformers.it/) — budujemy integracje KSeF, automatyzacje w n8n, dedykowane CLI-boty i narzędzia backoffice w TypeScript. Jeżeli Twój zespół potrzebuje CLI skrojonego pod Twój workflow księgowy (np. własne komendy eksportu do ERP, własny format wyciągu, integracja z Twoim systemem magazynowym) — [napisz do nas](https://codeformers.it/).
