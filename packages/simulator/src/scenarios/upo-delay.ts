import type { ScenarioHooks } from '../adapter.js'

export function upoDelay(): ScenarioHooks {
  const callCounts = new Map<string, number>()
  return {
    async beforeGetUpo(ref) {
      const count = (callCounts.get(ref) ?? 0) + 1
      callCounts.set(ref, count)
      if (count === 1) {
        return {
          ksefReference: ref,
          upoXml: '',
          status: 'pending' as const,
        }
      }
      return null // fall through to default (confirmed)
    },
  }
}
