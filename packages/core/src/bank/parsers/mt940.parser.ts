import type { BankStatementParser, BankTransaction } from '@ksefnik/shared'
import { Parser as Mt940JsParser } from 'mt940js'
import { extractFirstNIP } from '../nip-extractor.js'

function createMt940JsParser() {
  return new Mt940JsParser()
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function amountToGrosze(amount: number): number {
  return Math.round(amount * 100)
}

export class Mt940Parser implements BankStatementParser {
  bank = 'mt940'

  async canParse(content: string | Buffer): Promise<boolean> {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    return (text.includes(':20:') && (text.includes(':60F:') || text.includes(':61:'))) ||
      text.startsWith('{1:')
  }

  async parse(content: string | Buffer): Promise<BankTransaction[]> {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    const parser = createMt940JsParser()
    const statements = parser.parse(text)

    const transactions: BankTransaction[] = []

    for (const statement of statements) {
      for (const tx of statement.transactions) {
        const details = tx.details ?? ''
        const nip = extractFirstNIP(details)

        const isOutgoing = tx.amount < 0

        transactions.push({
          id: crypto.randomUUID(),
          date: formatDate(tx.date),
          amount: amountToGrosze(tx.amount),
          description: details,
          ...(isOutgoing
            ? { recipientNIP: nip, recipientName: extractName(details) }
            : { senderNIP: nip, senderName: extractName(details) }),
          bank: 'mt940',
          raw: details,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return transactions
  }
}

function extractName(details: string): string | undefined {
  // MT940 field 86 subfield ~27 contains beneficiary name
  const match = details.match(/~27([^~]+)/)
  if (match?.[1]) return match[1].trim()

  // fallback: try to find name after ~32
  const match32 = details.match(/~32([^~]+)/)
  if (match32?.[1]) return match32[1].trim()

  return undefined
}
