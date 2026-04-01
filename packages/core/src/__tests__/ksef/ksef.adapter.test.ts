import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KsefAdapterImpl } from '../../ksef/ksef.adapter.js'
import type { KsefClient, KsefClientConfig, KsefSessionState } from '../../ksef/types.js'

function createMockClient(): KsefClient {
  return {
    initSession: vi.fn().mockResolvedValue({
      token: 'test-token-123',
      nip: '5213456784',
      environment: 'test',
      expiresAt: new Date(Date.now() + 3600000),
      referenceNumber: 'REF-001',
    } satisfies KsefSessionState),
    terminateSession: vi.fn().mockResolvedValue(undefined),
    fetchInvoices: vi.fn().mockResolvedValue({
      invoices: [
        {
          ksefReferenceNumber: 'KSEF-REF-001',
          invoiceNumber: 'FV/2026/03/001',
          subjectNip: '5213456784',
          subjectName: 'TECHSOLUTIONS SP Z OO',
          invoicingDate: '2026-03-01',
          xml: '<Faktura/>',
        },
      ],
      total: 1,
    }),
    sendInvoice: vi.fn().mockResolvedValue({
      ksefReferenceNumber: 'KSEF-REF-002',
      timestamp: '2026-03-01T10:00:00Z',
    }),
    getUpo: vi.fn().mockResolvedValue({
      xml: '<UPO/>',
      status: 'confirmed',
    }),
  }
}

const testConfig: KsefClientConfig = {
  nip: '5213456784',
  environment: 'test',
  token: 'auth-token',
}

describe('KsefAdapterImpl', () => {
  let client: KsefClient
  let adapter: KsefAdapterImpl

  beforeEach(() => {
    client = createMockClient()
    adapter = new KsefAdapterImpl(client, testConfig)
  })

  describe('session management', () => {
    it('initializes session', async () => {
      await adapter.initSession()
      expect(client.initSession).toHaveBeenCalledWith(testConfig)
      expect(adapter.getSession()).not.toBeNull()
      expect(adapter.getSession()!.token).toBe('test-token-123')
    })

    it('closes session', async () => {
      await adapter.initSession()
      await adapter.closeSession()
      expect(client.terminateSession).toHaveBeenCalledWith('test-token-123')
      expect(adapter.getSession()).toBeNull()
    })

    it('does nothing when closing without session', async () => {
      await adapter.closeSession()
      expect(client.terminateSession).not.toHaveBeenCalled()
    })
  })

  describe('fetchInvoices', () => {
    it('throws without session', async () => {
      await expect(
        adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' }),
      ).rejects.toThrow('session not initialized')
    })

    it('fetches and maps invoices', async () => {
      await adapter.initSession()
      const invoices = await adapter.fetchInvoices({
        from: '2026-03-01',
        to: '2026-03-31',
      })

      expect(client.fetchInvoices).toHaveBeenCalledWith({
        token: 'test-token-123',
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        subjectNip: undefined,
        pageSize: undefined,
        pageOffset: undefined,
      })

      expect(invoices).toHaveLength(1)
      expect(invoices[0]!.invoiceNumber).toBe('FV/2026/03/001')
      expect(invoices[0]!.sellerNIP).toBe('5213456784')
      expect(invoices[0]!.ksefReference).toBe('KSEF-REF-001')
      expect(invoices[0]!.rawXml).toBe('<Faktura/>')
      expect(invoices[0]!.currency).toBe('PLN')
      expect(invoices[0]!.id).toBeDefined()
    })

    it('passes optional params', async () => {
      await adapter.initSession()
      await adapter.fetchInvoices({
        from: '2026-03-01',
        to: '2026-03-31',
        nip: '5213456784',
        pageSize: 10,
        pageOffset: 0,
      })

      expect(client.fetchInvoices).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectNip: '5213456784',
          pageSize: 10,
          pageOffset: 0,
        }),
      )
    })
  })

  describe('sendInvoice', () => {
    it('throws without session', async () => {
      await expect(
        adapter.sendInvoice({ xml: '<Faktura/>', nip: '5213456784' }),
      ).rejects.toThrow('session not initialized')
    })

    it('sends invoice and returns result', async () => {
      await adapter.initSession()
      const result = await adapter.sendInvoice({
        xml: '<Faktura/>',
        nip: '5213456784',
      })

      expect(client.sendInvoice).toHaveBeenCalledWith({
        token: 'test-token-123',
        xml: '<Faktura/>',
      })
      expect(result.ksefReference).toBe('KSEF-REF-002')
      expect(result.timestamp).toBe('2026-03-01T10:00:00Z')
    })
  })

  describe('getUpo', () => {
    it('throws without session', async () => {
      await expect(adapter.getUpo('KSEF-REF-001')).rejects.toThrow('session not initialized')
    })

    it('fetches UPO', async () => {
      await adapter.initSession()
      const result = await adapter.getUpo('KSEF-REF-001')

      expect(client.getUpo).toHaveBeenCalledWith({
        token: 'test-token-123',
        ksefReferenceNumber: 'KSEF-REF-001',
      })
      expect(result.ksefReference).toBe('KSEF-REF-001')
      expect(result.upoXml).toBe('<UPO/>')
      expect(result.status).toBe('confirmed')
    })
  })
})
