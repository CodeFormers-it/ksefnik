import { createKsefnik } from '@ksefnik/core'
import { createKsefSimulator } from '@ksefnik/simulator'
import type { Invoice } from '@ksefnik/shared'

// 1. Create simulator with sample invoices
const invoices: Invoice[] = [
  {
    id: crypto.randomUUID(),
    invoiceNumber: 'FV/2026/03/001',
    sellerNIP: '5213456784',
    sellerName: 'TECHSOLUTIONS SP Z OO',
    grossAmount: 123000, // 1230.00 PLN in grosze
    currency: 'PLN',
    issueDate: '2026-03-01',
    createdAt: new Date().toISOString(),
  },
]

const { adapter } = createKsefSimulator({ scenario: 'happy-path', invoices })

// 2. Create Ksefnik instance with simulator adapter
const ksef = createKsefnik({
  config: { nip: '5213456784', environment: 'test' },
  adapter,
})

// 3. Fetch invoices from KSeF (simulator)
const fetched = await ksef.invoices.fetch({ from: '2026-01-01', to: '2026-12-31' })
console.log(`Fetched ${fetched.length} invoices from KSeF`)

// 4. Import bank statement
const bankCsv = `#Data operacji;#Data księgowania;#Opis operacji;#Tytuł;#Nadawca/Odbiorca;#Numer konta;#Kwota;#Saldo po operacji;
2026-03-01;2026-03-01;PRZELEW WYCHODZĄCY;FV/2026/03/001 za uslugi;TECHSOLUTIONS SP Z OO;PL27114020040000300201355387;-1230,00;48770,00;`

const transactions = await ksef.bank.importFromString(bankCsv)
console.log(`Imported ${transactions.length} bank transactions`)

// 5. Run reconciliation
const stored = await ksef.invoices.list()
const report = await ksef.reconciliation.run(stored, transactions)

console.log('\n--- Reconciliation Report ---')
console.log(`Matched: ${report.summary.matchedCount}`)
console.log(`Unmatched invoices: ${report.summary.unmatchedInvoiceCount}`)
console.log(`Unmatched transactions: ${report.summary.unmatchedTransactionCount}`)
console.log(`Average confidence: ${report.summary.averageConfidence}%`)

for (const match of report.matched) {
  console.log(`  ✓ ${match.passName} (${match.confidence}%): ${match.reasons.join(', ')}`)
}
