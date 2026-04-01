import { z } from 'zod'

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const

export function isValidNIP(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false
  const digits = nip.split('').map(Number)
  const sum = NIP_WEIGHTS.reduce((acc, weight, i) => acc + weight * digits[i]!, 0)
  return sum % 11 === digits[9]
}

export const nipSchema = z
  .string()
  .regex(/^\d{10}$/, 'NIP must be exactly 10 digits')
  .refine(isValidNIP, { message: 'Invalid NIP checksum' })
