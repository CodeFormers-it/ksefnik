export function clampConfidence(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function dateProximityBonus(
  invoiceDate: string,
  transactionDate: string,
  maxDays: number = 30,
): number {
  const inv = new Date(invoiceDate).getTime()
  const tx = new Date(transactionDate).getTime()
  const diffDays = Math.abs(inv - tx) / (1000 * 60 * 60 * 24)

  if (diffDays <= 3) return 10
  if (diffDays <= 7) return 5
  if (diffDays <= maxDays) return 0
  return -10
}

export function amountMatchBonus(invoiceAmount: number, transactionAmount: number): number {
  if (Math.abs(transactionAmount) === invoiceAmount) return 5
  return 0
}

export function agePenalty(transactionDate: string, now: Date = new Date()): number {
  const tx = new Date(transactionDate).getTime()
  const diffDays = (now.getTime() - tx) / (1000 * 60 * 60 * 24)
  if (diffDays > 60) return -10
  return 0
}
