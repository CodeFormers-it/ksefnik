import type { Command } from 'commander'
import { createKsefnik } from '@ksefnik/core'
import { createMcpServer } from '@ksefnik/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { resolveConfig, type CliGlobalOpts } from '../utils/config.js'

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start MCP server for AI assistant integration')
    .option('--stdio', 'Use stdio transport (default)', true)
    .action(async () => {
      const globalOpts = program.opts<CliGlobalOpts>()
      const config = resolveConfig(globalOpts)
      const ksef = createKsefnik({ config })
      const server = createMcpServer(ksef)

      const transport = new StdioServerTransport()
      await server.connect(transport)
    })
}
