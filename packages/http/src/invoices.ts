import { PATHS } from './endpoints.js'
import { KsefApiError } from './errors.js'
import type { HttpClient } from './http.js'
import { parseInvoiceXml } from './xml.js'
import type { KsefRawInvoiceExt } from './types.js'
import type {
  KsefInvoiceMetadata,
  KsefInvoiceQueryDateType,
  KsefInvoiceQueryFilters,
  KsefInvoiceQuerySubjectType,
  KsefQueryInvoicesMetadataResponse,
} from './generated/index.js'

// Re-export spec-sourced types for grep-friendly names.
export type InvoiceQuerySubjectType = KsefInvoiceQuerySubjectType
export type InvoiceQueryDateType = KsefInvoiceQueryDateType
export type InvoiceQueryBody = KsefInvoiceQueryFilters
export type InvoiceMetadataItem = KsefInvoiceMetadata
export type PagedInvoiceMetadataResponse = KsefQueryInvoicesMetadataResponse

export interface FetchInvoicesHttpParams {
  accessToken: string
  dateFrom: string
  dateTo: string
  subjectType?: InvoiceQuerySubjectType
  dateType?: InvoiceQueryDateType
  pageSize?: number
  pageOffset?: number
  concurrency?: number
  /**
   * When true, also fetch the full FA(2)/FA(3) XML body for each invoice
   * via `GET /invoices/ksef/{ksefNumber}`. Metadata alone already includes
   * `grossAmount`, NIPs, dates and currency — so this is off by default.
   */
  includeXml?: boolean
}

function toIsoDate(date: string): string {
  if (date.includes('T')) return date
  return new Date(`${date}T00:00:00.000Z`).toISOString()
}

function toIsoDateEnd(date: string): string {
  if (date.includes('T')) return date
  return new Date(`${date}T23:59:59.999Z`).toISOString()
}

function toGroszeInt(amount: number | null | undefined): number | undefined {
  if (amount === undefined || amount === null) return undefined
  if (!Number.isFinite(amount)) return undefined
  return Math.round(amount * 100)
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) || 1 }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      const item = items[index] as T
      results[index] = await mapper(item, index)
    }
  })
  await Promise.all(workers)
  return results
}

export async function queryInvoiceMetadataPage(
  http: HttpClient,
  accessToken: string,
  body: InvoiceQueryBody,
  pageSize: number,
  pageOffset: number,
): Promise<PagedInvoiceMetadataResponse> {
  return http.request<PagedInvoiceMetadataResponse>({
    method: 'POST',
    path: PATHS.queryMetadata,
    headers: { Authorization: `Bearer ${accessToken}` },
    query: { pageSize, pageOffset },
    body,
  })
}

export async function fetchInvoiceXml(
  http: HttpClient,
  accessToken: string,
  ksefNumber: string,
): Promise<string> {
  return http.request<string>({
    method: 'GET',
    path: PATHS.invoiceByKsefNumber(ksefNumber),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/xml',
    },
    responseType: 'text',
  })
}

function nullish<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

function mapMetadataToRaw(meta: InvoiceMetadataItem): KsefRawInvoiceExt {
  const invoicingDate = nullish(meta.invoicingDate)
  const issueDate = nullish(meta.issueDate)
  const permanentStorageDate = nullish(meta.permanentStorageDate)
  const dateValue =
    invoicingDate?.slice(0, 10) ?? issueDate ?? permanentStorageDate ?? ''
  return {
    ksefReferenceNumber: meta.ksefNumber,
    invoiceNumber: meta.invoiceNumber,
    subjectNip: nullish(meta.seller?.nip) ?? '',
    subjectName: nullish(meta.seller?.name),
    invoicingDate: dateValue,
    xml: '',
    grossAmountGrosze: toGroszeInt(meta.grossAmount ?? undefined),
    currency: nullish(meta.currency) ?? 'PLN',
    buyerNip: nullish(meta.buyer?.identifier?.value),
    buyerName: nullish(meta.buyer?.name),
  }
}

export async function fetchInvoices(
  http: HttpClient,
  params: FetchInvoicesHttpParams,
): Promise<{ invoices: KsefRawInvoiceExt[]; total: number }> {
  const pageSize = params.pageSize ?? 100
  const pageOffset = params.pageOffset ?? 0
  const concurrency = params.concurrency ?? 5

  const body: InvoiceQueryBody = {
    subjectType: params.subjectType ?? 'Subject2',
    dateRange: {
      dateType: params.dateType ?? 'Invoicing',
      from: toIsoDate(params.dateFrom),
      to: toIsoDateEnd(params.dateTo),
    },
  }

  const all: InvoiceMetadataItem[] = []
  let currentOffset = pageOffset

  // Termination rules per KSeF 2.0 spec (/invoices/query/metadata description):
  //  - hasMore === false               → done
  //  - hasMore === true, isTruncated=false → increment pageOffset
  //  - hasMore === true, isTruncated=true  → hit the 10k technical limit;
  //    caller must narrow the dateRange and reset pageOffset. We surface
  //    this as a typed error so reconciliation callers can handle it.
  const MAX_PAGES = 10_000
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await queryInvoiceMetadataPage(
      http,
      params.accessToken,
      body,
      pageSize,
      currentOffset,
    )
    const items = response.invoices ?? []
    all.push(...items)
    if (response.hasMore !== true) break
    if (items.length === 0) break
    if (response.isTruncated === true) {
      throw new KsefApiError(
        'KSeF metadata query hit the 10000-record technical limit (isTruncated=true). ' +
          'Narrow the dateRange to a shorter window and re-issue the query.',
        undefined,
        undefined,
        'QUERY_TRUNCATED',
        { collected: all.length, lastDate: items.at(-1)?.invoicingDate ?? undefined },
      )
    }
    currentOffset += pageSize
  }

  const mapped = all.map(mapMetadataToRaw)

  if (params.includeXml === true && mapped.length > 0) {
    const enriched = await mapWithConcurrency(mapped, concurrency, async (raw) => {
      try {
        const xml = await fetchInvoiceXml(http, params.accessToken, raw.ksefReferenceNumber)
        const parsed = parseInvoiceXml(xml)
        return {
          ...raw,
          xml,
          grossAmountGrosze: raw.grossAmountGrosze ?? parsed.grossAmountGrosze,
        }
      } catch {
        return raw
      }
    })
    return { invoices: enriched, total: enriched.length }
  }

  return { invoices: mapped, total: mapped.length }
}
