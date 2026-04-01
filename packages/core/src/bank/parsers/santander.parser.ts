import type { BankStatementParser, BankTransaction } from '@ksefnik/shared'
import { parseCSV, stripBOM, parseAmount } from './csv-base.js'
import { extractFirstNIP } from '../nip-extractor.js'

function formatSantanderDate(ddmmyyyy: string): string {
  // Santander format: 01-03-2026 -> 2026-03-01
  const [dd, mm, yyyy] = ddmmyyyy.split('-')
  return `${yyyy}-${mm}-${dd}`
}

export class SantanderParser implements BankStatementParser {
  bank = 'santander'

  async canParse(content: string | Buffer): Promise<boolean> {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    return text.includes('Data operacji;Data waluty;Tytu') && text.includes('Nadawca/Odbiorca')
  }

  async parse(content: string | Buffer): Promise<BankTransaction[]> {
    const text = stripBOM(typeof content === 'string' ? content : content.toString('utf-8'))
    const rows = parseCSV(text, ';')

    const dataRows = rows.slice(1)
    const transactions: BankTransaction[] = []

    for (const row of dataRows) {
      const [dateRaw, , title, counterparty, , amountStr] = row
      if (!dateRaw || !amountStr) continue

      const date = formatSantanderDate(dateRaw)
      const amount = parseAmount(amountStr)
      const isOutgoing = amount < 0
      const description = title ?? ''
      const nip = extractFirstNIP(`${counterparty ?? ''} ${description}`)

      // Santander puts "FIRMA NIP: 1234567890" in counterparty field
      const cleanName = counterparty?.replace(/\s*NIP:\s*\d{10}/, '').trim()

      transactions.push({
        id: crypto.randomUUID(),
        date,
        amount,
        description,
        ...(isOutgoing
          ? { recipientName: cleanName, recipientNIP: nip }
          : { senderName: cleanName, senderNIP: nip }),
        bank: 'santander',
        raw: row.join(';'),
        createdAt: new Date().toISOString(),
      })
    }

    return transactions
  }
}
