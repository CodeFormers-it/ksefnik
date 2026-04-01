import type { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { createKsefnik, importBankStatementFromString } from '@ksefnik/core'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'
import { output } from '../utils/output.js'

export function registerReconcileCommand(program: Command): void {
  program
    .command('reconcile')
    .description('Run reconciliation between invoices and bank transactions')
    .requiredOption('--bank <file>', 'Bank statement file')
    .option('--format <format>', 'Output format: json|table', 'json')
    .action(async (opts: { bank: string; format: string }) => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const ksef = createKsefnik({ config })

      const bankContent = readFileSync(opts.bank, 'utf-8')
      const transactions = await ksef.bank.importFromString(bankContent)
      const invoices = await ksef.invoices.list()

      const report = await ksef.reconciliation.run(invoices, transactions)

      console.log(`Matched: ${report.summary.matchedCount}`)
      console.log(`Unmatched invoices: ${report.summary.unmatchedInvoiceCount}`)
      console.log(`Unmatched transactions: ${report.summary.unmatchedTransactionCount}`)
      console.log(`Average confidence: ${report.summary.averageConfidence}%`)

      if (opts.format === 'json') {
        output(report)
      }
    })
}
