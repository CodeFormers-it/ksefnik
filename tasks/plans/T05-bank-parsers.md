# T05 — @ksefnik/core: Bank Parsers & NIP Extraction

**Dependencies**: T02
**Lokalizacja**: `packages/core/src/bank/`
**Context7**: Sprawdź mt940js docs. Zbadaj formaty CSV polskich banków.

---

## T05.1 — NIP Extractor & Auto-Detect {#t051} ✅

**Pliki:**
- `src/bank/nip-extractor.ts`
- `src/bank/auto-detect.ts`
- `src/__tests__/bank/nip-extractor.test.ts`
- `src/__tests__/bank/auto-detect.test.ts`

**NIP extraction — strategie (w kolejności):**
1. MPP structured: `/NIP/1234567890/` lub `/VAT/.../IDC/.../INV/.../`
2. Prefixed: `NIP: 1234567890`, `NIP 1234567890`
3. Raw 10-digit z checksumą NIP (wagi `[6,5,7,2,3,4,5,6,7]`, mod 11)

**Auto-detect — logika:**
- MT940: plik zaczyna się od `:20:` lub zawiera `:60F:`, `:61:`
- CSV: czytaj nagłówki, matchuj patterns per bank
- Error jeśli żaden parser nie pasuje

**Testy**: NIP extraction z różnych formatów tytułów przelewów. Auto-detect na fixture'ach.

---

## T05.2 — MT940 Parser {#t052} ✅

**Pliki:**
- `src/bank/parsers/mt940.parser.ts`
- `src/__tests__/bank/parsers/mt940.parser.test.ts`

Używa `mt940js`. Mapuje pola MT940 na `BankTransaction` schema:
- `:61:` → date, amount, D/C indicator
- `:86:` → description (tytuł przelewu, z NIP extraction)
- Amount × 100 → grosze

**Test na fixture**: `tests/fixtures/mt940/sample.mt940`

---

## T05.3 — CSV Parsers: mBank + ING {#t053} ✅

**Pliki:**
- `src/bank/parsers/csv-base.ts` — shared: encoding detection (Windows-1250/UTF-8), delimiter, row iteration
- `src/bank/parsers/mbank.parser.ts`
- `src/bank/parsers/ing.parser.ts`
- `src/__tests__/bank/parsers/mbank.parser.test.ts`
- `src/__tests__/bank/parsers/ing.parser.test.ts`

Każdy parser: implements BankStatementParser, mapuje kolumny CSV na BankTransaction.
csv-base: obsługuje encoding (polskie znaki!), delimiter (`;` vs `,`), BOM.

---

## T05.4 — CSV Parsers: PKO + Santander & Parser Registry {#t054}

**Pliki:**
- `src/bank/parsers/pko.parser.ts`
- `src/bank/parsers/santander.parser.ts`
- `src/bank/parsers/index.ts` — registry: all parsers
- `src/bank/index.ts` — public API: `importBankStatement(filePath, opts?)`
- `src/__tests__/bank/parsers/pko.parser.test.ts`
- `src/__tests__/bank/parsers/santander.parser.test.ts`
- `src/__tests__/bank/import.test.ts` — integration: auto-detect + parse

`importBankStatement()`: czytaj plik → auto-detect → wybierz parser → parsuj → zwróć BankTransaction[]
