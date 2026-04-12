# @ksefnik/mcp — KSeF MCP server dla Claude, Cursor i agentów AI

**Model Context Protocol server do Krajowego Systemu e-Faktur (KSeF 2.0) w TypeScript / Node.js.** Podpina polskie e-faktury bezpośrednio pod Claude Desktop, Cursor, Continue i każdego innego klienta MCP. 8 narzędzi pokrywa pełny workflow: pobieranie faktur z KSeF, import wyciągów bankowych (MT940, mBank, ING, PKO BP, Santander), reconcyliacja faktur z przelewami, walidacja przed wysłaniem i wysyłka do KSeF — wszystko wywoływalne z poziomu zwykłego czatu z AI.

> Szukasz **KSeF MCP server**, **KSeF Claude AI integration**, **e-faktura AI agent** albo **Polish e-Invoice MCP**? Jesteś we właściwym miejscu. Ksefnik to jeden z pierwszych produkcyjnych serwerów Model Context Protocol do polskiej e-faktury.

MCP ([specyfikacja](https://modelcontextprotocol.io/)) to otwarty protokół stworzony przez Anthropic, który pozwala modelom językowym bezpiecznie wywoływać narzędzia na Twoim komputerze albo na serwerze. Ten pakiet opakowuje `@ksefnik/core` (silnik Ksefnika) w serwer MCP — dzięki czemu Claude Desktop (albo dowolny inny klient MCP) może:

- pobrać faktury z KSeF za podany zakres dat
- zaimportować wyciąg bankowy
- odpalić reconcyliację
- wyświetlić listę niedopasowanych faktur i przelewów
- zatwierdzić ręczne dopasowanie
- zwalidować fakturę przed wysłaniem
- wysłać fakturę do KSeF

…a wszystko z poziomu zwykłego czatu z AI. "Claude, pobierz mi faktury kosztowe za marzec i pokaż, które z nich nie mają odpowiednika na wyciągu ING" — i masz raport w 30 sekund zamiast dwóch godzin w Excelu.

## Instalacja

```bash
pnpm add @ksefnik/mcp @ksefnik/core
```

Do produkcji dochodzi adapter KSeF:

```bash
pnpm add @ksefnik/http
```

## Konfiguracja Claude Desktop

Najprostsza ścieżka — przez `@ksefnik/cli`, który zawiera komendę `mcp`:

```json
{
  "mcpServers": {
    "ksefnik": {
      "command": "npx",
      "args": ["-y", "@ksefnik/cli", "mcp"],
      "env": {
        "KSEF_NIP": "7010002137",
        "KSEF_TOKEN": "twój-token-z-portalu-MF",
        "KSEF_ENVIRONMENT": "production",
        "KSEF_PUBLIC_KEY_PATH": "/absolute/path/do/klucza/mf-public.pem"
      }
    }
  }
}
```

Restart Claude Desktop → przy ikonie kłódki zobaczysz nowy serwer z 8 narzędziami.

### Na Windows (PowerShell)

```json
{
  "mcpServers": {
    "ksefnik": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@ksefnik/cli", "mcp"],
      "env": {
        "KSEF_NIP": "7010002137",
        "KSEF_TOKEN": "...",
        "KSEF_ENVIRONMENT": "production",
        "KSEF_PUBLIC_KEY_PATH": "C:\\ksef\\mf-public.pem"
      }
    }
  }
}
```

## Programatyczne użycie

Jeżeli chcesz wystawić własny MCP server (np. wpięty w istniejącą aplikację albo z custom storage), pomiń CLI i użyj `createMcpServer()` bezpośrednio:

```ts
import { createKsefnik } from '@ksefnik/core'
import { createHttpAdapter } from '@ksefnik/http'
import { createMcpServer } from '@ksefnik/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFileSync } from 'node:fs'

const adapter = createHttpAdapter({
  nip: process.env.KSEF_NIP!,
  token: process.env.KSEF_TOKEN!,
  environment: 'production',
  publicKeyPem: readFileSync(process.env.KSEF_PUBLIC_KEY_PATH!, 'utf8'),
})

const ksef = createKsefnik({
  config: { nip: process.env.KSEF_NIP!, environment: 'production', token: process.env.KSEF_TOKEN! },
  adapter,
})

await adapter.initSession?.()

const server = createMcpServer(ksef)
await server.connect(new StdioServerTransport())
```

## Narzędzia MCP

Wszystkie 8 narzędzi rejestrowanych przez `createMcpServer()`:

| Narzędzie | Opis | Input (kluczowe pola) |
|---|---|---|
| `sync-invoices` | Pobiera faktury z KSeF za zakres dat, zapisuje do storage | `dateFrom`, `dateTo`, `nip?`, `subject: 'sales' \| 'cost'` |
| `query-invoices` | Zwraca faktury już zapisane w storage, z opcjonalnymi filtrami | `nip?`, `from?`, `to?`, `invoiceNumber?` |
| `import-bank` | Importuje treść wyciągu bankowego (auto-detekcja formatu: MT940 / mBank / ING / PKO / Santander) | `content` (string) |
| `reconcile` | Odpala 6-stopniowy pipeline reconcyliacji na aktualnym stanie storage | — |
| `get-unmatched` | Zwraca listy niedopasowanych faktur i transakcji z ostatniego runa | — |
| `confirm-match` | Ręcznie zatwierdza parę `invoiceId` ↔ `transactionId` (np. kiedy user widzi dopasowanie, którego pipeline nie znalazł) | `invoiceId`, `transactionId` |
| `validate-invoice` | Odpala reguły walidacyjne na pojedynczej fakturze (NIP, stawki VAT, kwoty, daty, struktura) | `invoice` |
| `send-invoice` | Wysyła zbudowaną fakturę do KSeF (wymaga adaptera z zaimplementowanym `sendInvoice`) | `xml`, `nip` |

### Dlaczego podział na `sync-invoices` i `query-invoices`

- **`sync-invoices`** woła KSeF. Wolno, podlega rate limitom, wymaga aktywnej sesji.
- **`query-invoices`** czyta lokalny storage. Szybkie, bezpieczne, bez I/O do MF.

Agent LLM nie musi tego odróżniać ręcznie — w opisie narzędzia jest wyraźnie powiedziane, kiedy użyć którego. Claude z reguły sam wybiera poprawnie: jeżeli potrzebuje świeżych danych — odpala `sync-invoices`, jeżeli chce coś wyfiltrować z tego, co już pobrał — `query-invoices`.

### `subject: 'sales' | 'cost'`

Mapuje się na `subjectType` w `FetchInvoicesOpts`:
- `sales` → `Subject1` (faktury sprzedażowe, firma = wystawca)
- `cost` → `Subject2` (faktury kosztowe, firma = nabywca)

Domyślnie `cost`, bo to zdecydowanie częstszy use case dla reconcyliacji z wyciągami bankowymi.

## Przykładowe prompty do Claude

Po poprawnej konfiguracji możesz pisać w czacie:

> "Pobierz faktury kosztowe za luty 2026 i sprawdź, które z nich mają duplikaty w numerze faktury."

> "Zaimportuj ten wyciąg z mBank *[wklejasz plik]* i odpal reconcyliację. Pokaż mi wszystkie przelewy powyżej 5000 zł, które nie zostały dopasowane."

> "Zwaliduj tę fakturę przed wysłaniem — zwróć uwagę na sumę VAT." *[załącznik z XML]*

> "Porównaj listy faktur kosztowych z lutego i marca 2026, znajdź kontrahentów, którzy pojawili się w obu miesiącach, i policz łączną wartość."

Claude potrafi łączyć kilka wywołań — np. `sync-invoices` → `import-bank` → `reconcile` → `get-unmatched` → analiza wyników — w jednej odpowiedzi, bez potrzeby ręcznego sterowania pipelinem.

## Bezpieczeństwo

- **Token KSeF i klucz publiczny MF** trafiają do serwera MCP przez zmienne środowiskowe (`env` w konfiguracji klienta MCP) — **nigdy** do logów, nigdy do prompta.
- **Storage jest lokalny.** Domyślnie in-memory, w trybie CLI można wskazać `SqliteStorage` — plik zostaje na Twoim dysku, nie jest wysyłany do modelu.
- **Narzędzia modyfikujące stan** (`sync-invoices`, `import-bank`, `send-invoice`, `confirm-match`) wymagają zgody użytkownika w kliencie MCP. Claude Desktop pyta przy każdym wywołaniu, dopóki nie zaznaczysz "zawsze zezwalaj".
- **`send-invoice` jest w MVP stubem** w `@ksefnik/http` (rzuca "not implemented"). Nie da się wysłać faktury na produkcję bez świadomej decyzji.

## Rozszerzanie

Własne narzędzia MCP możesz dorzucić przez plugin system z `@ksefnik/core`. Plugin implementujący `KsefPlugin.mcpTools()` zostanie automatycznie zarejestrowany przy starcie serwera.

## Powiązane pakiety

- [`@ksefnik/core`](../core) — silnik, który MCP wystawia
- [`@ksefnik/cli`](../cli) — CLI z komendą `mcp` (najszybsza ścieżka do Claude Desktop)
- [`@ksefnik/http`](../http) — adapter produkcyjny
- [`@ksefnik/simulator`](../simulator) — do testowania serwera MCP offline

## Licencja

MIT. Część monorepo [ksefnik](../../README.md) rozwijanego przez [CodeFormers.it](https://codeformers.it/). Budujemy agentowe integracje KSeF, MCP serwery pod wewnętrzne systemy firm i dedykowane narzędzia AI do automatyzacji backoffice. Potrzebujesz agenta, który co poniedziałek ściąga faktury kosztowe, robi reconcyliację i wysyła raport na Slack? [Zróbmy to razem](https://codeformers.it/).
