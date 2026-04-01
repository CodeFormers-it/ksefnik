import { describe, it, expect } from 'vitest'
import { createProgram } from '../../main.js'

describe('fetch command', () => {
  it('is registered on program', () => {
    const program = createProgram()
    const fetchCmd = program.commands.find((c) => c.name() === 'fetch')
    expect(fetchCmd).toBeDefined()
    expect(fetchCmd!.description()).toBe('Fetch invoices from KSeF')
  })
})
