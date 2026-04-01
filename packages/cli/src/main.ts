import { Command } from 'commander'
import { registerFetchCommand } from './commands/fetch.js'
import { registerSendCommand } from './commands/send.js'

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

  return program
}
