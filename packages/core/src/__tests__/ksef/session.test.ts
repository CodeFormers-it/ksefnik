import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionManager } from '../../ksef/session.js'
import type { KsefClient, KsefClientConfig, KsefSessionState } from '../../ksef/types.js'

function createMockClient(): KsefClient {
  let callCount = 0
  return {
    initSession: vi.fn().mockImplementation(async () => {
      callCount++
      return {
        token: `token-${callCount}`,
        nip: '5213456784',
        environment: 'test',
        expiresAt: new Date(Date.now() + 3600000),
        referenceNumber: `REF-${callCount}`,
      } satisfies KsefSessionState
    }),
    terminateSession: vi.fn().mockResolvedValue(undefined),
    fetchInvoices: vi.fn(),
    sendInvoice: vi.fn(),
    getUpo: vi.fn(),
  }
}

const config: KsefClientConfig = {
  nip: '5213456784',
  environment: 'test',
  token: 'auth',
}

describe('SessionManager', () => {
  let client: KsefClient
  let manager: SessionManager

  beforeEach(() => {
    client = createMockClient()
    manager = new SessionManager(client, config)
  })

  it('creates session on first ensure()', async () => {
    const session = await manager.ensure()
    expect(session.token).toBe('token-1')
    expect(client.initSession).toHaveBeenCalledTimes(1)
  })

  it('reuses existing session on subsequent ensure()', async () => {
    await manager.ensure()
    await manager.ensure()
    expect(client.initSession).toHaveBeenCalledTimes(1)
  })

  it('renews session when close to expiry', async () => {
    // First session expires in 30 seconds (below 60s threshold)
    ;(client.initSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      token: 'expiring-token',
      nip: '5213456784',
      environment: 'test',
      expiresAt: new Date(Date.now() + 30000), // 30s left
      referenceNumber: 'REF-EXPIRING',
    })

    await manager.ensure() // creates expiring session
    const session = await manager.ensure() // should renew

    expect(client.terminateSession).toHaveBeenCalledWith('expiring-token')
    expect(client.initSession).toHaveBeenCalledTimes(2)
    expect(session.token).not.toBe('expiring-token')
  })

  it('does not renew when plenty of time left', async () => {
    await manager.ensure()
    await manager.ensure()
    await manager.ensure()
    expect(client.initSession).toHaveBeenCalledTimes(1)
    expect(client.terminateSession).not.toHaveBeenCalled()
  })

  it('closes session', async () => {
    await manager.ensure()
    await manager.close()
    expect(client.terminateSession).toHaveBeenCalledWith('token-1')
    expect(manager.current).toBeNull()
  })

  it('does nothing when closing without session', async () => {
    await manager.close()
    expect(client.terminateSession).not.toHaveBeenCalled()
  })

  it('tracks isActive correctly', async () => {
    expect(manager.isActive).toBe(false)
    await manager.ensure()
    expect(manager.isActive).toBe(true)
    await manager.close()
    expect(manager.isActive).toBe(false)
  })
})
