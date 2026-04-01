import { describe, it, expect } from 'vitest'
import { createKsefSimulator } from '../index.js'
import { KsefApiError, KsefSessionError, KsefTimeoutError } from '@ksefnik/shared'
import type { Invoice } from '@ksefnik/shared'

const mockInvoice: Invoice = {
  id: 'inv-1', invoiceNumber: 'FV/2026/03/001', sellerNIP: '5213456784',
  grossAmount: 123000, currency: 'PLN', issueDate: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
}

describe('happy-path scenario', () => {
  it('fetches invoices successfully', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'happy-path', invoices: [mockInvoice] })
    const invoices = await adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' })
    expect(invoices).toHaveLength(1)
  })

  it('sends invoice successfully', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'happy-path' })
    const result = await adapter.sendInvoice({ xml: '<Faktura/>', nip: '5213456784' })
    expect(result.ksefReference).toBeDefined()
  })

  it('gets UPO confirmed', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'happy-path' })
    const result = await adapter.getUpo('REF-001')
    expect(result.status).toBe('confirmed')
  })
})

describe('timeout scenario', () => {
  it('throws KsefTimeoutError on fetch', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'timeout' })
    await expect(
      adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' }),
    ).rejects.toThrow(KsefTimeoutError)
  })
})

describe('invalid-nip scenario', () => {
  it('throws KsefApiError on send', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'invalid-nip' })
    await expect(
      adapter.sendInvoice({ xml: '<Faktura/>', nip: '0000000000' }),
    ).rejects.toThrow(KsefApiError)
  })
})

describe('session-expired scenario', () => {
  it('first fetch succeeds, second throws KsefSessionError', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'session-expired' })
    await adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' })
    await expect(
      adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' }),
    ).rejects.toThrow(KsefSessionError)
  })
})

describe('upo-delay scenario', () => {
  it('first getUpo returns pending, second returns confirmed', async () => {
    const { adapter } = createKsefSimulator({ scenario: 'upo-delay' })
    const r1 = await adapter.getUpo('REF-001')
    expect(r1.status).toBe('pending')
    const r2 = await adapter.getUpo('REF-001')
    expect(r2.status).toBe('confirmed')
  })
})
