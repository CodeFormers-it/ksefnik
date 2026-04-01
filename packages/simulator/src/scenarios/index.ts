import type { ScenarioHooks } from '../adapter.js'
import type { ScenarioName } from '../types.js'
import { happyPath } from './happy-path.js'
import { timeout } from './timeout.js'
import { invalidNip } from './invalid-nip.js'
import { sessionExpired } from './session-expired.js'
import { upoDelay } from './upo-delay.js'

export function getScenarioHooks(name: ScenarioName): ScenarioHooks {
  switch (name) {
    case 'happy-path': return happyPath()
    case 'timeout': return timeout(100) // short for tests
    case 'invalid-nip': return invalidNip()
    case 'session-expired': return sessionExpired()
    case 'upo-delay': return upoDelay()
  }
}

export { happyPath, timeout, invalidNip, sessionExpired, upoDelay }
