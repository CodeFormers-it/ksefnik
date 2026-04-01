import { readFileSync } from 'node:fs'
import type { BankTransaction, BankStatementParser } from '@ksefnik/shared'
import { UnsupportedBankFormatError } from '@ksefnik/shared'
import { getDefaultParsers } from './parsers/index.js'

export { extractNIPs, extractFirstNIP } from './nip-extractor.js'
export { detectBankFormat } from './auto-detect.js'
export * from './parsers/index.js'

export interface ImportBankStatementOpts {
  parsers?: BankStatementParser[]
}

export async function importBankStatement(
  filePath: string,
  opts?: ImportBankStatementOpts,
): Promise<BankTransaction[]> {
  const content = readFileSync(filePath, 'utf-8')
  return importBankStatementFromString(content, opts)
}

export async function importBankStatementFromString(
  content: string,
  opts?: ImportBankStatementOpts,
): Promise<BankTransaction[]> {
  const parsers = opts?.parsers ?? getDefaultParsers()

  for (const parser of parsers) {
    if (await parser.canParse(content)) {
      return parser.parse(content)
    }
  }

  throw new UnsupportedBankFormatError('unknown')
}
