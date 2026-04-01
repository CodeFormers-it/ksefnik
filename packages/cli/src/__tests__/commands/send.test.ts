import { describe, it, expect } from 'vitest'
import { createProgram } from '../../main.js'

describe('send command', () => {
  it('is registered on program', () => {
    const program = createProgram()
    const sendCmd = program.commands.find((c) => c.name() === 'send')
    expect(sendCmd).toBeDefined()
    expect(sendCmd!.description()).toBe('Send invoice XML to KSeF')
  })
})
