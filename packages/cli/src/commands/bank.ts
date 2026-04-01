import type { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { createKsefnik, importBankStatementFromString } from '@ksefnik/core'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'
import { output } from '../utils/output.js'

export function registerBankCommand(program: Command): void {
  const bank = program.command('bank').description('Bank statement operations')

  bank
    .command('import <file>')
    .description('Import bank statement file')
    .option('--format <format>', 'Output format: json|table', 'json')
    .action(async (file: string, opts: { format: string }) => {
      const content = readFileSync(file, 'utf-8')
      const transactions = await importBankStatementFromString(content)

      console.log(`Imported ${transactions.length} transactions`)
      output(
        transactions.map((t) => ({
          date: t.date,
          amount: (t.amount / 100).toFixed(2),
          description: t.description.slice(0, 60),
          bank: t.bank,
        })),
        opts.format as 'json' | 'table',
      )
    })
}
