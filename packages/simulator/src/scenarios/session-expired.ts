import { KsefSessionError } from '@ksefnik/shared'
import type { ScenarioHooks } from '../adapter.js'

export function sessionExpired(): ScenarioHooks {
  let requestCount = 0
  return {
    async beforeFetch() {
      requestCount++
      if (requestCount > 1) {
        throw new KsefSessionError('Session expired after first request')
      }
    },
    async beforeSend() {
      requestCount++
      if (requestCount > 1) {
        throw new KsefSessionError('Session expired after first request')
      }
    },
  }
}
