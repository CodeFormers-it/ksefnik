import { describe, it, expect } from 'vitest'
import type { KsefPlugin, ReconciliationPass, MatchingContext, MatchResult } from '@ksefnik/shared'
import { PluginRegistry } from '../../plugins/registry.js'

const mockPlugin: KsefPlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  reconciliationPasses() {
    return [{
      name: 'plugin-pass',
      order: 600,
      async run(_ctx: MatchingContext): Promise<MatchResult[]> { return [] },
    }]
  },
}

describe('PluginRegistry', () => {
  it('starts empty', () => {
    const reg = new PluginRegistry()
    expect(reg.list()).toHaveLength(0)
  })

  it('registers and lists plugins', () => {
    const reg = new PluginRegistry()
    reg.register(mockPlugin)
    expect(reg.list()).toHaveLength(1)
    expect(reg.list()[0]!.name).toBe('test-plugin')
  })

  it('merges core + plugin passes sorted by order', () => {
    const reg = new PluginRegistry()
    reg.register(mockPlugin)
    const passes = reg.getPasses()
    expect(passes.length).toBe(7) // 6 core + 1 plugin
    expect(passes[passes.length - 1]!.name).toBe('plugin-pass')
    expect(passes[passes.length - 1]!.order).toBe(600)
  })

  it('returns only core passes when no plugins', () => {
    const reg = new PluginRegistry()
    const passes = reg.getPasses()
    expect(passes).toHaveLength(6)
  })

  it('handles plugins without reconciliationPasses', () => {
    const reg = new PluginRegistry()
    reg.register({ name: 'minimal', version: '0.1.0' })
    const passes = reg.getPasses()
    expect(passes).toHaveLength(6) // only core passes
  })
})
