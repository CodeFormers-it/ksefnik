import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TtlCache, cacheKey } from '../../ksef/cache.js'

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves values', () => {
    const cache = new TtlCache(5000)
    cache.set('key1', { data: 'test' })
    expect(cache.get('key1')).toEqual({ data: 'test' })
  })

  it('returns undefined for missing keys', () => {
    const cache = new TtlCache(5000)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('expires entries after TTL', () => {
    const cache = new TtlCache(5000)
    cache.set('key1', 'value')
    expect(cache.get('key1')).toBe('value')

    vi.advanceTimersByTime(5001)
    expect(cache.get('key1')).toBeUndefined()
  })

  it('does not expire entries before TTL', () => {
    const cache = new TtlCache(5000)
    cache.set('key1', 'value')
    vi.advanceTimersByTime(4999)
    expect(cache.get('key1')).toBe('value')
  })

  it('invalidates specific key', () => {
    const cache = new TtlCache(5000)
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.invalidate('key1')
    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBe('value2')
  })

  it('invalidates all keys', () => {
    const cache = new TtlCache(5000)
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.invalidateAll()
    expect(cache.size).toBe(0)
  })

  it('tracks size', () => {
    const cache = new TtlCache(5000)
    expect(cache.size).toBe(0)
    cache.set('key1', 'v')
    expect(cache.size).toBe(1)
    cache.set('key2', 'v')
    expect(cache.size).toBe(2)
  })
})

describe('cacheKey', () => {
  it('produces deterministic keys regardless of property order', () => {
    const key1 = cacheKey({ a: 1, b: 2 })
    const key2 = cacheKey({ b: 2, a: 1 })
    expect(key1).toBe(key2)
  })

  it('produces different keys for different params', () => {
    const key1 = cacheKey({ a: 1 })
    const key2 = cacheKey({ a: 2 })
    expect(key1).not.toBe(key2)
  })
})
