# T04 — @ksefnik/core: KSeF Adapter

**Dependencies**: T02, T03
**Lokalizacja**: `packages/core/src/ksef/`
**Context7**: Sprawdź docs @ksef/client przed implementacją

---

## T04.1 — Adapter Implementation {#t041} ✅

**Pliki:**
- `src/ksef/ksef.adapter.ts` — wraps @ksef/client, implements KsefAdapter
- `src/ksef/types.ts` — internal types (session state, etc.)
- `src/ksef/index.ts`
- `src/__tests__/ksef/ksef.adapter.test.ts`

Bazowa implementacja bez retry/cache. Testy mockują @ksef/client.

---

## T04.2 — Retry & Exponential Backoff {#t042} ✅

**Pliki:**
- `src/ksef/retry.ts` — generic `withRetry<T>(fn, opts)`
- `src/__tests__/ksef/retry.test.ts`

Parametry: maxAttempts=3, baseDelay=1000ms, maxDelay=10000ms.
Retry na: network errors, HTTP 429, 500-503. NIE retry na 4xx (poza 429).
Jitter: `+ Math.random() * baseDelay * 0.1`

---

## T04.3 — Cache & Session Management {#t043}

**Pliki:**
- `src/ksef/cache.ts` — TTL-based in-memory cache, default 5min
- `src/ksef/session.ts` — session lifecycle: init, auto-renew, close
- `src/__tests__/ksef/cache.test.ts`
- `src/__tests__/ksef/session.test.ts`

Cache key = hash parametrów requestu. Invalidate na write operations (send).
Session auto-renewal: sprawdź expiry przed każdym API call, odśwież jeśli < 60s do wygaśnięcia.
