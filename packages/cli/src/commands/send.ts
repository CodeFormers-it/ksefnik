import type { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { createKsefnik } from '@ksefnik/core'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'
import { output } from '../utils/output.js'

export function registerSendCommand(program: Command): void {
  program
    .command('send <filePath>')
    .description('Send invoice XML to KSeF')
    .option('--format <format>', 'Output format: json|text', 'json')
    .action(async (filePath: string, opts: { format: string }) => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const ksef = createKsefnik({ config })

      const xml = readFileSync(filePath, 'utf-8')
      const result = await ksef.invoices.send({ xml, nip: config.nip })

      if (opts.format === 'text') {
        console.log(`KSeF reference: ${result.ksefReference}`)
        console.log(`Timestamp: ${result.timestamp}`)
      } else {
        output(result)
      }
    })
}
