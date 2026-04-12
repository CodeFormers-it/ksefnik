import type { Command } from 'commander'
import { createKsefnik } from '@ksefnik/core'
import { createMcpServer } from '@ksefnik/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { resolveAdapter, resolveConfig, type CliGlobalOpts } from '../utils/config.js'

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start MCP server for AI assistant integration')
    .option('--stdio', 'Use stdio transport (default)', true)
    .action(async () => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const adapter = resolveAdapter(globalOpts, config)
      const ksef = createKsefnik({ config, adapter })
      const server = createMcpServer(ksef)

      // NOTE: session init is lazy — the KsefAdapterImpl in @ksefnik/core
      // authenticates on first tool call that needs it. Eager init here
      // would deadlock the MCP handshake if auth fails (client never gets
      // the `initialize` response because the process dies with stderr).
      const transport = new StdioServerTransport()
      await server.connect(transport)
    })
}
