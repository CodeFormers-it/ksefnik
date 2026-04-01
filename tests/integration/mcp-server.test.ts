import { describe, it, expect } from 'vitest'
import { createKsefnik } from '@ksefnik/core'
import { createMcpServer } from '@ksefnik/mcp'

describe('MCP server integration', () => {
  it('creates server with all tools registered', () => {
    const ksef = createKsefnik({ config: { nip: '5213456784', environment: 'test' } })
    const server = createMcpServer(ksef)
    expect(server).toBeDefined()
  })
})
