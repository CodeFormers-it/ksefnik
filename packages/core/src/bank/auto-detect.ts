export type BankFormat = 'mt940' | 'mbank' | 'ing' | 'pko' | 'santander'

export function detectBankFormat(content: string): BankFormat | null {
  // MT940: starts with SWIFT message tags or contains MT940 fields
  if (content.includes(':20:') && (content.includes(':60F:') || content.includes(':61:'))) {
    return 'mt940'
  }
  if (content.startsWith('{1:')) {
    return 'mt940'
  }

  // CSV detection: check first few lines for header patterns
  const firstLines = content.slice(0, 2000)

  // mBank: headers start with #
  if (firstLines.includes('#Data operacji') && firstLines.includes('#Opis operacji')) {
    return 'mbank'
  }

  // ING: quoted headers with specific columns
  if (firstLines.includes('"Data transakcji"') && firstLines.includes('"Dane kontrahenta"')) {
    return 'ing'
  }

  // PKO BP: comma-separated with specific headers
  if (firstLines.includes('"Data operacji"') && firstLines.includes('"Typ transakcji"')) {
    return 'pko'
  }

  // Santander: unquoted headers with specific pattern
  if (firstLines.includes('Data operacji;Data waluty;Tytu') && firstLines.includes('Nadawca/Odbiorca')) {
    return 'santander'
  }

  return null
}
