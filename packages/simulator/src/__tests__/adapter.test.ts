import { describe, it, expect } from 'vitest'
import { MockKsefAdapter } from '../adapter.js'
import { InvoiceStore } from '../invoice-store.js'
import type { Invoice } from '@ksefnik/shared'

const mockInvoice: Invoice = {
  id: 'inv-1',
  invoiceNumber: 'FV/2026/03/001',
  sellerNIP: '5213456784',
  grossAmount: 123000,
  currency: 'PLN',
  issueDate: '2026-03-01',
  createdAt: '2026-03-01T10:00:00Z',
}

describe('MockKsefAdapter', () => {
  it('fetches invoices from store', async () => {
    const store = new InvoiceStore()
    store.seed([mockInvoice])
    const adapter = new MockKsefAdapter(store)

    const invoices = await adapter.fetchInvoices({ from: '2026-03-01', to: '2026-03-31' })
    expect(invoices).toHaveLength(1)
    expect(invoices[0]!.invoiceNumber).toBe('FV/2026/03/001')
  })

  it('sends invoice and returns reference', async () => {
    const adapter = new MockKsefAdapter(new InvoiceStore())
    const result = await adapter.sendInvoice({ xml: '<Faktura/>', nip: '5213456784' })
    expect(result.ksefReference).toMatch(/^KSEF-SIM-/)
    expect(result.timestamp).toBeDefined()
  })

  it('gets UPO with confirmed status', async () => {
    const adapter = new MockKsefAdapter(new InvoiceStore())
    const result = await adapter.getUpo('KSEF-REF-001')
    expect(result.status).toBe('confirmed')
    expect(result.ksefReference).toBe('KSEF-REF-001')
  })

  it('applies scenario hooks', async () => {
    const adapter = new MockKsefAdapter(new InvoiceStore(), {
      beforeSend: async () => { throw new Error('Simulated error') },
    })
    await expect(adapter.sendInvoice({ xml: '', nip: '' })).rejects.toThrow('Simulated error')
  })
})
