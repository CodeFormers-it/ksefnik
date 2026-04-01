import type { BankStatementParser, BankTransaction } from '@ksefnik/shared'
import { parseCSV, stripBOM, parseAmount } from './csv-base.js'
import { extractFirstNIP } from '../nip-extractor.js'

export class PkoParser implements BankStatementParser {
  bank = 'pko'

  async canParse(content: string | Buffer): Promise<boolean> {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    return text.includes('"Data operacji"') && text.includes('"Typ transakcji"')
  }

  async parse(content: string | Buffer): Promise<BankTransaction[]> {
    const text = stripBOM(typeof content === 'string' ? content : content.toString('utf-8'))
    const rows = parseCSV(text, ',')

    const dataRows = rows.slice(1)
    const transactions: BankTransaction[] = []

    for (const row of dataRows) {
      const [date, , , amountStr, , , counterparty, title, nipRaw] = row
      if (!date || !amountStr) continue

      const amount = parseAmount(amountStr)
      const isOutgoing = amount < 0
      const description = title ?? ''
      const nip = nipRaw?.match(/^\d{10}$/)?.[0] ?? extractFirstNIP(`${counterparty ?? ''} ${description}`)

      transactions.push({
        id: crypto.randomUUID(),
        date,
        amount,
        description,
        ...(isOutgoing
          ? { recipientName: counterparty, recipientNIP: nip }
          : { senderName: counterparty, senderNIP: nip }),
        bank: 'pko',
        raw: row.join(','),
        createdAt: new Date().toISOString(),
      })
    }

    return transactions
  }
}
