import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Ksefnik } from '@ksefnik/core'
import { syncInvoicesSchema, syncInvoices } from './tools/sync-invoices.js'
import { importBankSchema, importBank } from './tools/import-bank.js'
import { reconcile } from './tools/reconcile.js'
import { getUnmatchedSchema, getUnmatched } from './tools/get-unmatched.js'

export function createMcpServer(ksef: Ksefnik): McpServer {
  const server = new McpServer({
    name: 'ksefnik',
    version: '0.0.1',
  })

  server.tool('sync-invoices', syncInvoicesSchema.shape, async (input) => {
    const result = await syncInvoices(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.tool('import-bank', importBankSchema.shape, async (input) => {
    const result = await importBank(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.tool('reconcile', {}, async () => {
    const result = await reconcile(ksef)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.tool('get-unmatched', getUnmatchedSchema.shape, async (input) => {
    const result = await getUnmatched(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  return server
}
