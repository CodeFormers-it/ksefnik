#!/usr/bin/env node
import { createKsefnik } from '@ksefnik/core'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from './server.js'

const nip = process.env['KSEF_NIP'] ?? process.env['KSEFNIK_NIP'] ?? ''
const token = process.env['KSEF_TOKEN'] ?? process.env['KSEFNIK_TOKEN']
const environment =
  (process.env['KSEF_ENV'] ?? process.env['KSEFNIK_ENV'] ?? 'test') as 'production' | 'demo' | 'test'

async function resolveAdapter() {
  if (token && nip) {
    const { createHttpAdapter } = await import('@ksefnik/http')
    return createHttpAdapter({ nip, token, environment })
  }
  const { createKsefSimulator } = await import('@ksefnik/simulator')
  return createKsefSimulator({ scenario: 'happy-path' }).adapter
}

const adapter = await resolveAdapter()
const ksef = createKsefnik({ config: { nip, environment, token }, adapter })
const server = createMcpServer(ksef)

const transport = new StdioServerTransport()
await server.connect(transport)
