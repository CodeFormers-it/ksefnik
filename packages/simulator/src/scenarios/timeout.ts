import { KsefTimeoutError } from '@ksefnik/shared'
import type { ScenarioHooks } from '../adapter.js'

export function timeout(delayMs: number = 10000): ScenarioHooks {
  return {
    async beforeFetch() {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      throw new KsefTimeoutError('Simulated KSeF timeout')
    },
    async beforeSend() {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      throw new KsefTimeoutError('Simulated KSeF timeout')
    },
  }
}
