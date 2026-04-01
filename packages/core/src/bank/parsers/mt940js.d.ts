declare module 'mt940js' {
  interface Transaction {
    date: Date
    amount: number
    details: string
    reference: string
    currency: string
    isReversal: boolean
    transactionType: string
    entryDate?: Date
    bankReference?: string
    extraDetails?: string
    structuredDetails?: Record<string, string>
  }

  interface Statement {
    transactionReference: string
    accountIdentification: string
    currency: string
    openingBalance: number
    closingBalance: number
    openingBalanceDate: Date
    closingBalanceDate: Date
    transactions: Transaction[]
  }

  export class Parser {
    parse(data: string): Statement[]
  }
}
