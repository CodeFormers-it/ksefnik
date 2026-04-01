import { describe, it, expect } from 'vitest'
import { createMcpServer } from '../server.js'
import { createKsefnik } from '@ksefnik/core'

describe('createMcpServer', () => {
  it('creates MCP server with tools', () => {
    const ksef = createKsefnik({ config: { nip: '5213456784', environment: 'test' } })
    const server = createMcpServer(ksef)
    expect(server).toBeDefined()
  })
})
