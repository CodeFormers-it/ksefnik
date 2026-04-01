import type { ReconciliationPass } from '@ksefnik/shared'
import { ksefRefPass } from './ksef-ref.pass.js'
import { exactPass } from './exact.pass.js'
import { invoiceRefPass } from './invoice-ref.pass.js'
import { fuzzyPass } from './fuzzy.pass.js'
import { partialPass } from './partial.pass.js'
import { proximityPass } from './proximity.pass.js'

export { ksefRefPass } from './ksef-ref.pass.js'
export { exactPass } from './exact.pass.js'
export { invoiceRefPass } from './invoice-ref.pass.js'
export { fuzzyPass } from './fuzzy.pass.js'
export { partialPass } from './partial.pass.js'
export { proximityPass } from './proximity.pass.js'

export const defaultPasses: ReconciliationPass[] = [
  ksefRefPass,
  exactPass,
  invoiceRefPass,
  fuzzyPass,
  partialPass,
  proximityPass,
].sort((a, b) => a.order - b.order)
