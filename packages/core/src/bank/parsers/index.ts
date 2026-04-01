import type { BankStatementParser } from '@ksefnik/shared'
import { Mt940Parser } from './mt940.parser.js'
import { MbankParser } from './mbank.parser.js'
import { IngParser } from './ing.parser.js'
import { PkoParser } from './pko.parser.js'
import { SantanderParser } from './santander.parser.js'

export { Mt940Parser } from './mt940.parser.js'
export { MbankParser } from './mbank.parser.js'
export { IngParser } from './ing.parser.js'
export { PkoParser } from './pko.parser.js'
export { SantanderParser } from './santander.parser.js'

const defaultParsers: BankStatementParser[] = [
  new Mt940Parser(),
  new MbankParser(),
  new IngParser(),
  new PkoParser(),
  new SantanderParser(),
]

export function getDefaultParsers(): BankStatementParser[] {
  return defaultParsers
}
