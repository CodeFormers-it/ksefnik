import type { KsefPlugin, ReconciliationPass } from '@ksefnik/shared'
import { defaultPasses } from '../matching/passes/index.js'

export class PluginRegistry {
  private plugins: KsefPlugin[] = []

  register(plugin: KsefPlugin): void {
    this.plugins.push(plugin)
  }

  list(): KsefPlugin[] {
    return [...this.plugins]
  }

  getPasses(): ReconciliationPass[] {
    const pluginPasses = this.plugins.flatMap((p) => p.reconciliationPasses?.() ?? [])
    return [...defaultPasses, ...pluginPasses].sort((a, b) => a.order - b.order)
  }
}
