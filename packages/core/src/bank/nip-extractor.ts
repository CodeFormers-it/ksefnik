import { isValidNIP } from '@ksefnik/shared'

const MPP_PATTERN = /\/NIP\/(\d{10})\//
const IDC_PATTERN = /\/IDC\/(\d{10})\//
const PREFIXED_PATTERN = /NIP[:\s]*(\d{10})/gi
const RAW_10_DIGIT = /\b(\d{10})\b/g

export function extractNIPs(text: string): string[] {
  const found = new Set<string>()

  // Strategy 1: MPP structured
  const mppMatch = text.match(MPP_PATTERN)
  if (mppMatch?.[1]) {
    found.add(mppMatch[1])
  }
  const idcMatch = text.match(IDC_PATTERN)
  if (idcMatch?.[1]) {
    found.add(idcMatch[1])
  }

  // Strategy 2: Prefixed (NIP: or NIP followed by digits)
  let prefixMatch: RegExpExecArray | null
  while ((prefixMatch = PREFIXED_PATTERN.exec(text)) !== null) {
    if (prefixMatch[1]) {
      found.add(prefixMatch[1])
    }
  }

  // Strategy 3: Raw 10-digit with valid checksum
  let rawMatch: RegExpExecArray | null
  while ((rawMatch = RAW_10_DIGIT.exec(text)) !== null) {
    if (rawMatch[1] && isValidNIP(rawMatch[1])) {
      found.add(rawMatch[1])
    }
  }

  return [...found]
}

export function extractFirstNIP(text: string): string | undefined {
  return extractNIPs(text)[0]
}
