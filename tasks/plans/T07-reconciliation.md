# T07 — @ksefnik/core: Reconciliation Engine

**Dependencies**: T03, T05, T06
**Lokalizacja**: `packages/core/src/matching/`
**Source of truth**: docs/architecture.md — sekcja "Reconciliation pipeline"

---

## T07.1 — Pipeline Infrastructure & Scoring {#t071}

**Pliki:**
- `src/matching/pipeline.ts` — orkiestracja passów
- `src/matching/scoring.ts` — confidence helpers
- `src/matching/context.ts` — MatchingContext implementation
- `src/matching/index.ts`
- `src/__tests__/matching/pipeline.test.ts`

**Pipeline logic:**
1. Przyjmij invoices[] + transactions[]
2. Stwórz mutable sets unmatched
3. Sortuj passy po `order`
4. Dla każdego pass: uruchom `pass.run(context)` → otrzymaj MatchResult[]
5. Filtruj wyniki, dodaj do matched, usuń z unmatched
6. Po wszystkich passach: zbuduj ReconciliationReport z summary

**Scoring**: Base score z pass → bonusy (exact amount, exact date) → kary (stary przelew > 60 dni). Clamp 0-100.

---

## T07.2 — Pass 100 (ksef-ref) & Pass 200 (exact) {#t072}

**Pliki:**
- `src/matching/passes/ksef-ref.pass.ts`
- `src/matching/passes/exact.pass.ts`
- `src/__tests__/matching/passes/ksef-ref.pass.test.ts`
- `src/__tests__/matching/passes/exact.pass.test.ts`

**ksef-ref (order 100):**
- Szukaj `invoice.ksefReference` jako substring w `transaction.description`
- Case-insensitive
- Confidence: 99

**exact (order 200):**
- `|transaction.amount| === invoice.grossAmount` AND
- NIP extracted z `transaction.description` === `invoice.sellerNIP`
- Confidence: 95

---

## T07.3 — Pass 300 (invoice-ref) & Pass 400 (fuzzy) {#t073}

**Pliki:**
- `src/matching/passes/invoice-ref.pass.ts`
- `src/matching/passes/fuzzy.pass.ts`
- `src/__tests__/matching/passes/invoice-ref.pass.test.ts`
- `src/__tests__/matching/passes/fuzzy.pass.test.ts`

**invoice-ref (order 300):**
- Szukaj `invoice.invoiceNumber` jako substring w `transaction.description`
- Obsłuż formaty: `FV/2026/03/001`, `FA 123/2026`, etc.
- Confidence: 90 (jeśli kwota też pasuje), 75 (jeśli tylko numer)

**fuzzy (order 400):**
- `fuzzball.ratio(transaction.senderName, invoice.sellerName)` >= 80
- AND `|transaction.amount| === invoice.grossAmount`
- Confidence: 80
- Context7: sprawdź API fuzzball

---

## T07.4 — Pass 450 (partial) & Pass 500 (proximity) {#t074}

**Pliki:**
- `src/matching/passes/partial.pass.ts`
- `src/matching/passes/proximity.pass.ts`
- `src/__tests__/matching/passes/partial.pass.test.ts`
- `src/__tests__/matching/passes/proximity.pass.test.ts`

**partial (order 450):**
- Grupuj transakcje po senderNIP
- Dla każdej faktury: szukaj kombinacji transakcji od tego samego NIP których suma == grossAmount
- Greedy approach (nie full subset-sum)
- Match z wieloma transactionIds
- Confidence: 70 (exact sum), 50 (95% sum)

**proximity (order 500):**
- Kwota: `invoice.grossAmount * 0.95` do `* 1.05`
- Data: `transaction.date` w ±30 dni od `invoice.dueDate` (lub issueDate)
- Confidence = 50 + (20 × proximity_factor), malejący z odległością
- Fallback — najniższy confidence

---

## T07.5 — Pass Registry & Pipeline Integration Tests {#t075}

**Pliki:**
- `src/matching/passes/index.ts` — eksportuje 6 passów jako ordered array
- `src/__tests__/matching/pipeline.integration.test.ts`

**Integration test scenario:**
- ~20 faktur + ~30 transakcji
- Część matchuje po KSeF ref, część po NIP, część fuzzy, część partial
- Weryfikuj: każdy pass łapie właściwe matche, brak re-matchowania, summary poprawne
- Weryfikuj: unmatched lists zawierają to co powinny
