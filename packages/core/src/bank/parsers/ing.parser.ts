import type { BankStatementParser, BankTransaction } from '@ksefnik/shared'
import { parseCSV, stripBOM, parseAmount } from './csv-base.js'
import { extractFirstNIP } from '../nip-extractor.js'

function formatIngDate(yyyymmdd: string): string {
  // ING format: 20260301 -> 2026-03-01
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export class IngParser implements BankStatementParser {
  bank = 'ing'

  async canParse(content: string | Buffer): Promise<boolean> {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    return text.includes('"Data transakcji"') && text.includes('"Dane kontrahenta"')
  }

  async parse(content: string | Buffer): Promise<BankTransaction[]> {
    const text = stripBOM(typeof content === 'string' ? content : content.toString('utf-8'))
    const rows = parseCSV(text, ';')

    const dataRows = rows.slice(1)
    const transactions: BankTransaction[] = []

    for (const row of dataRows) {
      const [dateRaw, , counterparty, title, , , details, , amountStr] = row
      if (!dateRaw || !amountStr) continue

      const date = formatIngDate(dateRaw)
      const amount = parseAmount(amountStr)
      const isOutgoing = amount < 0
      const description = title ?? ''
      const nip = extractFirstNIP(`${counterparty ?? ''} ${details ?? ''} ${description}`)

      transactions.push({
        id: crypto.randomUUID(),
        date,
        amount,
        description,
        ...(isOutgoing
          ? { recipientName: counterparty?.split(' UL ')[0]?.split(' ul ')[0], recipientNIP: nip }
          : { senderName: counterparty?.split(' UL ')[0]?.split(' ul ')[0], senderNIP: nip }),
        bank: 'ing',
        raw: row.join(';'),
        createdAt: new Date().toISOString(),
      })
    }

    return transactions
  }
}
