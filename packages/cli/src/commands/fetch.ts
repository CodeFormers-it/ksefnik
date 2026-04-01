import type { Command } from 'commander'
import { createKsefnik } from '@ksefnik/core'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'
import { output } from '../utils/output.js'

export function registerFetchCommand(program: Command): void {
  program
    .command('fetch')
    .description('Fetch invoices from KSeF')
    .requiredOption('--from <date>', 'Start date (YYYY-MM-DD)')
    .requiredOption('--to <date>', 'End date (YYYY-MM-DD)')
    .option('--format <format>', 'Output format: json|table', 'json')
    .action(async (opts: { from: string; to: string; format: string }) => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const ksef = createKsefnik({ config })

      const invoices = await ksef.invoices.fetch({
        from: opts.from,
        to: opts.to,
        nip: config.nip || undefined,
      })

      output(invoices, opts.format as 'json' | 'table')
    })
}
