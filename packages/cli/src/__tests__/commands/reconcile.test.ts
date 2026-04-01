import { describe, it, expect } from 'vitest'
import { createProgram } from '../../main.js'

describe('reconcile command', () => {
  it('is registered on program', () => {
    const program = createProgram()
    const cmd = program.commands.find((c) => c.name() === 'reconcile')
    expect(cmd).toBeDefined()
  })
})
