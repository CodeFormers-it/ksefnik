interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private readonly ttlMs: number

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttlMs = ttlMs
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidateAll(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}

export function cacheKey(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort())
}
