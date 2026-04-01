import { KsefApiError } from '@ksefnik/shared'
import type { ScenarioHooks } from '../adapter.js'

export function invalidNip(): ScenarioHooks {
  return {
    async beforeSend(input) {
      throw new KsefApiError(`NIP validation failed for: ${input.nip}`, 400, { nip: input.nip })
    },
  }
}
