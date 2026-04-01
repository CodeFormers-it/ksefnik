import { describe, it, expect } from 'vitest'
import { createProgram } from '../../main.js'

describe('bank command', () => {
  it('is registered on program', () => {
    const program = createProgram()
    const bankCmd = program.commands.find((c) => c.name() === 'bank')
    expect(bankCmd).toBeDefined()
  })
})
