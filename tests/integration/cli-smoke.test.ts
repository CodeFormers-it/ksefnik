import { describe, it, expect } from 'vitest'
import { createProgram } from '@ksefnik/cli'

describe('CLI smoke tests', () => {
  it('creates program with all commands', () => {
    const program = createProgram()
    const names = program.commands.map((c) => c.name())

    expect(names).toContain('fetch')
    expect(names).toContain('send')
    expect(names).toContain('bank')
    expect(names).toContain('reconcile')
    expect(names).toContain('validate')
    expect(names).toContain('mcp')
  })

  it('has correct version', () => {
    const program = createProgram()
    expect(program.version()).toBe('0.0.1')
  })

  it('has global options', () => {
    const program = createProgram()
    const optionNames = program.options.map((o) => o.long)
    expect(optionNames).toContain('--nip')
    expect(optionNames).toContain('--env')
    expect(optionNames).toContain('--token')
    expect(optionNames).toContain('--debug')
  })
})
