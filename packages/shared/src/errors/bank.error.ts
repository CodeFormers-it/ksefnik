import { KsefnikError } from './base.js'

export class BankParseError extends KsefnikError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('BANK_PARSE_ERROR', message, context)
    this.name = 'BankParseError'
  }
}

export class UnsupportedBankFormatError extends KsefnikError {
  constructor(format: string) {
    super('BANK_FORMAT_UNSUPPORTED', `Unsupported bank format: ${format}`, { format })
    this.name = 'UnsupportedBankFormatError'
  }
}
