import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Ksefnik } from '@ksefnik/core'
import { syncInvoicesSchema, syncInvoices } from './tools/sync-invoices.js'
import { importBankSchema, importBank } from './tools/import-bank.js'
import { reconcile } from './tools/reconcile.js'
import { getUnmatchedSchema, getUnmatched } from './tools/get-unmatched.js'
import { queryInvoicesSchema, queryInvoices } from './tools/query-invoices.js'
import { sendInvoiceSchema, sendInvoiceTool } from './tools/send-invoice.js'
import { validateInvoiceSchema, validateInvoiceTool } from './tools/validate-invoice.js'
import { confirmMatchSchema, confirmMatch } from './tools/confirm-match.js'
import { getUpoSchema, getUpo } from './tools/get-upo.js'

export function createMcpServer(ksef: Ksefnik): McpServer {
  const server = new McpServer({
    name: 'ksefnik',
    version: '0.0.1',
  })

  server.registerTool('sync-invoices', {
    description: 'Fetch invoices from KSeF for a given date range',
    inputSchema: syncInvoicesSchema.shape,
  }, async (input) => {
    const result = await syncInvoices(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('import-bank', {
    description: 'Import bank statement content (auto-detects format)',
    inputSchema: importBankSchema.shape,
  }, async (input) => {
    const result = await importBank(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('reconcile', {
    description: 'Run reconciliation pipeline on stored invoices and transactions',
  }, async () => {
    const result = await reconcile(ksef)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('get-unmatched', {
    description: 'Get unmatched invoices and transactions from a reconciliation report',
    inputSchema: getUnmatchedSchema.shape,
  }, async (input) => {
    const result = await getUnmatched(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('query-invoices', {
    description: 'Query stored invoices by NIP, date range, or invoice number',
    inputSchema: queryInvoicesSchema.shape,
  }, async (input) => {
    const result = await queryInvoices(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('send-invoice', {
    description: 'Send invoice XML to KSeF',
    inputSchema: sendInvoiceSchema.shape,
  }, async (input) => {
    const result = await sendInvoiceTool(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('validate-invoice', {
    description: 'Validate an invoice against 20 Polish tax rules',
    inputSchema: validateInvoiceSchema.shape,
  }, async (input) => {
    const result = validateInvoiceTool(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('confirm-match', {
    description: 'Confirm or reject a reconciliation match',
    inputSchema: confirmMatchSchema.shape,
  }, async (input) => {
    const result = confirmMatch(input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  server.registerTool('get-upo', {
    description: 'Check UPO (Urzędowe Poświadczenie Odbioru) status for a sent invoice',
    inputSchema: getUpoSchema.shape,
  }, async (input) => {
    const result = await getUpo(ksef, input)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
  })

  return server
}
