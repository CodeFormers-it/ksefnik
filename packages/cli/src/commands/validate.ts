import type { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { createKsefnik } from '@ksefnik/core'
import type { Invoice } from '@ksefnik/shared'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'
import { output } from '../utils/output.js'

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <file>')
    .description('Validate invoice JSON file')
    .option('--format <format>', 'Output format: json|table', 'json')
    .action(async (file: string, opts: { format: string }) => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const ksef = createKsefnik({ config })

      const content = readFileSync(file, 'utf-8')
      const invoices: Invoice[] = JSON.parse(content)
      const arr = Array.isArray(invoices) ? invoices : [invoices]

      const reports = ksef.validation.validate(arr)

      for (const report of reports) {
        const errors = report.results.filter((r) => !r.valid)
        if (errors.length === 0) {
          console.log(`✓ ${report.invoice.invoiceNumber}: valid`)
        } else {
          console.log(`✗ ${report.invoice.invoiceNumber}: ${errors.length} error(s)`)
          for (const err of errors) {
            console.log(`  - [${err.rule}] ${err.field ?? ''}: ${err.message ?? 'invalid'}`)
          }
        }
      }

      if (opts.format === 'json') {
        output(reports)
      }
    })
}
