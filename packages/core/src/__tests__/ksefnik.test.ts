import { describe, it, expect } from 'vitest'
import { createKsefnik } from '../ksefnik.js'

describe('createKsefnik', () => {
  it('creates instance with all namespaces', () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    expect(ksef.invoices).toBeDefined()
    expect(ksef.bank).toBeDefined()
    expect(ksef.reconciliation).toBeDefined()
    expect(ksef.validation).toBeDefined()
    expect(ksef.plugins).toBeDefined()
    expect(ksef.storage).toBeDefined()
  })

  it('uses in-memory storage by default', async () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    const invoices = await ksef.invoices.list()
    expect(invoices).toEqual([])
  })

  it('throws when fetching without adapter', async () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    await expect(
      ksef.invoices.fetch({ from: '2026-03-01', to: '2026-03-31' }),
    ).rejects.toThrow('No KSeF adapter configured')
  })

  it('imports bank statement and stores transactions', async () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    const csv = `#Data operacji;#Data księgowania;#Opis operacji;#Tytuł;#Nadawca/Odbiorca;#Numer konta;#Kwota;#Saldo po operacji;
2026-03-01;2026-03-01;PRZELEW WYCHODZĄCY;FV/2026/03/001;FIRMA;PL27114020040000300201355387;-1230,00;48770,00;`

    const txs = await ksef.bank.importFromString(csv)
    expect(txs).toHaveLength(1)

    const stored = await ksef.bank.list()
    expect(stored).toHaveLength(1)
  })

  it('runs reconciliation', async () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    const report = await ksef.reconciliation.run([], [])
    expect(report.matched).toEqual([])
    expect(report.summary.matchedCount).toBe(0)
  })

  it('validates invoices', () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    const reports = ksef.validation.validate([{
      id: '550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'FV/001',
      sellerNIP: '5213456784',
      grossAmount: 123000,
      currency: 'PLN',
      issueDate: '2026-03-01',
      createdAt: '2026-03-01T10:00:00Z',
    }])

    expect(reports).toHaveLength(1)
    expect(reports[0]!.valid).toBe(true)
  })

  it('registers plugins', () => {
    const ksef = createKsefnik({
      config: { nip: '5213456784', environment: 'test' },
    })

    ksef.plugins.register({ name: 'test', version: '1.0.0' })
    expect(ksef.plugins.list()).toHaveLength(1)
  })
})
