import { XMLParser } from 'fast-xml-parser'

const MAX_INVOICE_XML_BYTES = 5 * 1024 * 1024

export interface ParsedInvoiceFields {
  invoiceNumber: string
  sellerNip: string
  sellerName?: string
  buyerNip: string
  buyerName?: string
  invoicingDate: string
  grossAmountGrosze: number
  currency: string
}

interface FaPodmiotDane {
  NIP?: string | number
  Nazwa?: string
  ImiePierwsze?: string
  Nazwisko?: string
}

interface FaPodmiot {
  DaneIdentyfikacyjne?: FaPodmiotDane
}

interface FaFa {
  P_1?: string
  P_2?: string
  P_15?: string | number
  KodWaluty?: string
}

interface FaDocument {
  Podmiot1?: FaPodmiot
  Podmiot2?: FaPodmiot
  Fa?: FaFa
}

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  removeNSPrefix: true,
  trimValues: true,
})

function pickFakturaRoot(doc: unknown): FaDocument | undefined {
  if (!doc || typeof doc !== 'object') return undefined
  const keys = Object.keys(doc as Record<string, unknown>)
  for (const key of keys) {
    if (key === 'Faktura' || key.endsWith(':Faktura')) {
      return (doc as Record<string, FaDocument>)[key]
    }
  }
  return undefined
}

function toGrosze(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  const raw = typeof value === 'string' ? value.replace(/\s+/g, '').replace(',', '.') : String(value)
  const asNumber = Number(raw)
  if (!Number.isFinite(asNumber)) return 0
  return Math.round(asNumber * 100)
}

function displayName(dane: FaPodmiotDane | undefined): string | undefined {
  if (!dane) return undefined
  if (dane.Nazwa) return dane.Nazwa
  const person = [dane.ImiePierwsze, dane.Nazwisko].filter(Boolean).join(' ').trim()
  return person.length > 0 ? person : undefined
}

function extractNip(dane: FaPodmiotDane | undefined): string {
  if (!dane || dane.NIP === undefined || dane.NIP === null) return ''
  return String(dane.NIP).replace(/\D/g, '')
}

export function parseInvoiceXml(xml: string): ParsedInvoiceFields {
  if (xml.length > MAX_INVOICE_XML_BYTES) {
    throw new Error(
      `Invoice XML exceeds ${MAX_INVOICE_XML_BYTES} byte limit (${xml.length} bytes)`,
    )
  }
  const parsed = parser.parse(xml) as unknown
  const faktura = pickFakturaRoot(parsed)
  if (!faktura) {
    throw new Error('Invalid invoice XML: missing Faktura root element')
  }

  const fa = faktura.Fa ?? {}
  const seller = faktura.Podmiot1?.DaneIdentyfikacyjne
  const buyer = faktura.Podmiot2?.DaneIdentyfikacyjne

  return {
    invoiceNumber: fa.P_2 ?? '',
    invoicingDate: fa.P_1 ?? '',
    sellerNip: extractNip(seller),
    sellerName: displayName(seller),
    buyerNip: extractNip(buyer),
    buyerName: displayName(buyer),
    grossAmountGrosze: toGrosze(fa.P_15),
    currency: fa.KodWaluty ?? 'PLN',
  }
}
