import { describe, it, expect } from 'vitest'
import { createProgram } from '../../main.js'

describe('mcp command', () => {
  it('is registered on program', () => {
    const program = createProgram()
    const cmd = program.commands.find((c) => c.name() === 'mcp')
    expect(cmd).toBeDefined()
    expect(cmd!.description()).toContain('MCP server')
  })
})
