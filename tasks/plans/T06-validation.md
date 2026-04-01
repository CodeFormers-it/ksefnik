# T06 — @ksefnik/core: Validation Engine

**Dependencies**: T02
**Lokalizacja**: `packages/core/src/validation/`

---

## T06.1 — Framework & First 10 Rules {#t061} ✅

**Pliki:**
- `src/validation/rule.ts` — ValidationRule interface
- `src/validation/engine.ts` — validateInvoices(): uruchamia reguły, agreguje wyniki
- `src/validation/rules/` — 10 plików reguł (poniżej)
- `src/__tests__/validation/engine.test.ts`
- `src/__tests__/validation/rules.test.ts`

**Pierwsze 10 reguł:**
1. `required-fields.ts` — invoice ma: invoiceNumber, sellerNIP, grossAmount, issueDate
2. `nip-format.ts` — sellerNIP: 10 cyfr + checksum
3. `buyer-nip-format.ts` — buyerNIP format (jeśli obecny)
4. `nip-not-zeros.ts` — NIP != "0000000000"
5. `amount-positive.ts` — grossAmount > 0
6. `amount-max.ts` — grossAmount <= 99_999_999_99 (999,999.99 PLN)
7. `date-valid.ts` — issueDate to poprawny ISO date
8. `date-not-future.ts` — issueDate nie w przyszłości (+1 dzień tolerancji)
9. `date-order.ts` — dueDate >= issueDate (jeśli oba obecne)
10. `vat-rate-valid.ts` — vatRate ∈ {0, 5, 8, 23} lub zwolniony

**Testy**: Każda reguła z valid + invalid input.

---

## T06.2 — Remaining 10 Rules & Validation Index {#t062} ✅

**Pliki:**
- 10 kolejnych plików reguł:
  11. `invoice-number-format.ts` — niepusty, rozsądna długość
  12. `duplicate-check.ts` — brak duplikatów w batch (numer + seller NIP)
  13. `currency-valid.ts` — PLN
  14. `line-items-sum.ts` — suma pozycji = grossAmount
  15. `vat-calculation.ts` — VAT = net × rate (z tolerancją 1 grosz)
  16. `seller-buyer-different.ts` — sellerNIP != buyerNIP
  17. `date-range.ts` — nie starsza niż 10 lat
  18. `quantity-positive.ts` — lineItems[].quantity > 0
  19. `description-length.ts` — max 256 znaków per pozycja
  20. `ksef-reference-format.ts` — pattern jeśli obecny
- `src/validation/rules/index.ts` — eksportuje tablicę 20 reguł
- `src/validation/index.ts` — public API: `validateInvoices(invoices[])`
- `src/__tests__/validation/all-rules.test.ts`
