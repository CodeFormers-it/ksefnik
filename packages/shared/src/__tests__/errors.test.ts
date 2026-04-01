import { describe, it, expect } from 'vitest'
import {
  KsefnikError,
  KsefApiError,
  KsefSessionError,
  KsefTimeoutError,
  InvoiceValidationError,
  BankParseError,
  UnsupportedBankFormatError,
  ReconciliationError,
} from '../errors/index.js'

describe('KsefnikError', () => {
  it('stores code, message, and context', () => {
    const err = new KsefnikError('TEST_CODE', 'test message', { key: 'value' })
    expect(err.code).toBe('TEST_CODE')
    expect(err.message).toBe('test message')
    expect(err.context).toEqual({ key: 'value' })
    expect(err.name).toBe('KsefnikError')
    expect(err).toBeInstanceOf(Error)
  })

  it('works without context', () => {
    const err = new KsefnikError('TEST', 'msg')
    expect(err.context).toBeUndefined()
  })
})

describe('KsefApiError', () => {
  it('has correct code and statusCode', () => {
    const err = new KsefApiError('API failed', 500)
    expect(err.code).toBe('KSEF_API_ERROR')
    expect(err.statusCode).toBe(500)
    expect(err.name).toBe('KsefApiError')
    expect(err).toBeInstanceOf(KsefnikError)
  })
})

describe('KsefSessionError', () => {
  it('has correct code', () => {
    const err = new KsefSessionError('Session expired')
    expect(err.code).toBe('KSEF_SESSION_ERROR')
    expect(err.name).toBe('KsefSessionError')
    expect(err).toBeInstanceOf(KsefnikError)
  })
})

describe('KsefTimeoutError', () => {
  it('has correct code', () => {
    const err = new KsefTimeoutError('Request timed out')
    expect(err.code).toBe('KSEF_TIMEOUT_ERROR')
    expect(err.name).toBe('KsefTimeoutError')
    expect(err).toBeInstanceOf(KsefnikError)
  })
})

describe('InvoiceValidationError', () => {
  it('stores rule, field, and value', () => {
    const err = new InvoiceValidationError('nip-checksum', 'sellerNIP', '1234567890')
    expect(err.code).toBe('VALIDATION_INVOICE')
    expect(err.rule).toBe('nip-checksum')
    expect(err.field).toBe('sellerNIP')
    expect(err.value).toBe('1234567890')
    expect(err.name).toBe('InvoiceValidationError')
    expect(err.message).toContain('nip-checksum')
    expect(err).toBeInstanceOf(KsefnikError)
  })

  it('accepts custom message', () => {
    const err = new InvoiceValidationError('test', 'field', null, 'Custom message')
    expect(err.message).toBe('Custom message')
  })
})

describe('BankParseError', () => {
  it('has correct code', () => {
    const err = new BankParseError('Failed to parse MT940')
    expect(err.code).toBe('BANK_PARSE_ERROR')
    expect(err.name).toBe('BankParseError')
    expect(err).toBeInstanceOf(KsefnikError)
  })
})

describe('UnsupportedBankFormatError', () => {
  it('includes format in message', () => {
    const err = new UnsupportedBankFormatError('unknown-bank')
    expect(err.code).toBe('BANK_FORMAT_UNSUPPORTED')
    expect(err.message).toContain('unknown-bank')
    expect(err.context).toEqual({ format: 'unknown-bank' })
    expect(err.name).toBe('UnsupportedBankFormatError')
  })
})

describe('ReconciliationError', () => {
  it('has correct code', () => {
    const err = new ReconciliationError('Pipeline failed')
    expect(err.code).toBe('RECONCILIATION_ERROR')
    expect(err.name).toBe('ReconciliationError')
    expect(err).toBeInstanceOf(KsefnikError)
  })
})
