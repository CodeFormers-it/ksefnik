#!/usr/bin/env node
import { Command } from 'commander'
import { registerFetchCommand } from './commands/fetch.js'
import { registerSendCommand } from './commands/send.js'
import { registerBankCommand } from './commands/bank.js'
import { registerReconcileCommand } from './commands/reconcile.js'
import { registerValidateCommand } from './commands/validate.js'
import { registerMcpCommand } from './commands/mcp.js'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('ksefnik')
    .description('KSeF reconciliation CLI')
    .version('0.0.1')
    .option('--nip <nip>', 'NIP number')
    .option('--env <environment>', 'KSeF environment: production|demo|test (default: env KSEFNIK_ENV or test)')
    .option('--token <token>', 'KSeF API token')
    .option('--adapter <kind>', 'KSeF adapter: http | simulator (default: env KSEFNIK_ADAPTER or http)')
    .option(
      '--public-key <pathOrPem>',
      'Path to KSeF MF public key (PEM) or inline PEM; required for HTTP adapter',
    )
    .option('--debug', 'Enable debug output')

  registerFetchCommand(program)
  registerSendCommand(program)
  registerBankCommand(program)
  registerReconcileCommand(program)
  registerValidateCommand(program)
  registerMcpCommand(program)

  return program
}

const isDirectRun =
  process.argv[1]?.endsWith('/main.js') ||
  process.argv[1]?.endsWith('/main.ts') ||
  process.argv[1]?.endsWith('/ksefnik')

if (isDirectRun) {
  createProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`ksefnik: ${message}\n`)
    process.exit(1)
  })
}
