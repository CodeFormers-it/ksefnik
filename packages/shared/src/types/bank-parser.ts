import type { BankTransaction } from '../schemas/index.js'

export interface BankStatementParser {
  bank: string
  canParse(content: string | Buffer): Promise<boolean>
  parse(content: string | Buffer): Promise<BankTransaction[]>
}
