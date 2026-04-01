import type { KsefPlugin } from '@ksefnik/shared'

export async function loadPlugin(name: string): Promise<KsefPlugin | null> {
  try {
    const mod = await import(name)
    const plugin: KsefPlugin = mod.default ?? mod
    if (!plugin.name || !plugin.version) return null
    return plugin
  } catch {
    return null
  }
}
