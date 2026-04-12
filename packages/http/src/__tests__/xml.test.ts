import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseInvoiceXml } from '../xml.js'

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const fa2Xml = readFileSync(path.join(fixtureDir, 'fixtures', 'fa2-invoice.xml'), 'utf8')

describe('parseInvoiceXml — FA(2)', () => {
  it('extracts invoice number, dates, NIPs, gross amount and currency', () => {
    const parsed = parseInvoiceXml(fa2Xml)
    expect(parsed.invoiceNumber).toBe('FV/2026/03/42')
    expect(parsed.invoicingDate).toBe('2026-03-15')
    expect(parsed.sellerNip).toBe('5252344078')
    expect(parsed.sellerName).toBe('Acme Sp. z o.o.')
    expect(parsed.buyerNip).toBe('7010002137')
    expect(parsed.buyerName).toBe('Build Eco Sp. z o.o.')
    expect(parsed.currency).toBe('PLN')
    expect(parsed.grossAmountGrosze).toBe(123456)
  })

  it('parses amount with comma decimal separator', () => {
    const xml = fa2Xml.replace('<P_15>1234.56</P_15>', '<P_15>1 234,56</P_15>')
    const parsed = parseInvoiceXml(xml)
    expect(parsed.grossAmountGrosze).toBe(123456)
  })

  it('throws on non-Faktura XML root', () => {
    expect(() => parseInvoiceXml('<NotFaktura/>')).toThrow(/Faktura root element/)
  })
})
