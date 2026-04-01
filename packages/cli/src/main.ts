import { Command } from 'commander'
import { registerFetchCommand } from './commands/fetch.js'
import { registerSendCommand } from './commands/send.js'
import { registerBankCommand } from './commands/bank.js'
import { registerReconcileCommand } from './commands/reconcile.js'
import { registerValidateCommand } from './commands/validate.js'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('ksefnik')
    .description('KSeF reconciliation CLI')
    .version('0.0.1')
    .option('--nip <nip>', 'NIP number')
    .option('--env <environment>', 'KSeF environment: production|demo|test', 'test')
    .option('--token <token>', 'KSeF API token')
    .option('--debug', 'Enable debug output')

  registerFetchCommand(program)
  registerSendCommand(program)
  registerBankCommand(program)
  registerReconcileCommand(program)
  registerValidateCommand(program)

  return program
}
