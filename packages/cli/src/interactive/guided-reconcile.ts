import * as p from '@clack/prompts'
import { createKsefnik, importBankStatementFromString } from '@ksefnik/core'
import { readFileSync } from 'node:fs'
import type { KsefnikConfig } from '@ksefnik/shared'

export async function guidedReconcile(): Promise<void> {
  p.intro('Ksefnik — Guided Reconciliation')

  const bankFile = await p.text({
    message: 'Path to bank statement file:',
    placeholder: './bank-statement.csv',
    validate: (v) => (v.length === 0 ? 'Required' : undefined),
  })
  if (p.isCancel(bankFile)) return

  const nip = await p.text({
    message: 'Your NIP:',
    placeholder: '1234567890',
    validate: (v) => (v.length !== 10 ? 'NIP must be 10 digits' : undefined),
  })
  if (p.isCancel(nip)) return

  const config: KsefnikConfig = { nip, environment: 'test' }
  const ksef = createKsefnik({ config })

  const s = p.spinner()
  s.start('Importing bank statement...')

  const content = readFileSync(bankFile, 'utf-8')
  const transactions = await ksef.bank.importFromString(content)
  s.stop(`Imported ${transactions.length} transactions`)

  const invoices = await ksef.invoices.list()

  s.start('Running reconciliation...')
  const report = await ksef.reconciliation.run(invoices, transactions)
  s.stop('Reconciliation complete')

  p.note(
    [
      `Matched: ${report.summary.matchedCount}`,
      `Unmatched invoices: ${report.summary.unmatchedInvoiceCount}`,
      `Unmatched transactions: ${report.summary.unmatchedTransactionCount}`,
      `Average confidence: ${report.summary.averageConfidence}%`,
    ].join('\n'),
    'Results',
  )

  p.outro('Done!')
}
