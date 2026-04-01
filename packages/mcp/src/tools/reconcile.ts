import type { Ksefnik } from '@ksefnik/core'

export async function reconcile(ksef: Ksefnik) {
  const invoices = await ksef.invoices.list()
  const transactions = await ksef.bank.list()
  const report = await ksef.reconciliation.run(invoices, transactions)
  await ksef.storage.saveReport(report)
  return report
}
