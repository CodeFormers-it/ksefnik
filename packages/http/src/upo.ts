import { PATHS } from './endpoints.js'
import type { HttpClient } from './http.js'

export interface FetchUpoParams {
  accessToken: string
  sessionReferenceNumber: string
  ksefNumber: string
}

/**
 * Fetches the UPO (Urzędowe Poświadczenie Odbioru) XML for an invoice
 * via `GET /sessions/{referenceNumber}/invoices/ksef/{ksefNumber}/upo`.
 *
 * Returns the raw UPO XML string. Throws `KsefApiError` with code 21178
 * when the UPO is not yet available (invoice still being processed).
 */
export async function fetchUpoXml(
  http: HttpClient,
  params: FetchUpoParams,
): Promise<string> {
  return http.request<string>({
    method: 'GET',
    path: PATHS.invoiceUpoByKsefNumber(params.sessionReferenceNumber, params.ksefNumber),
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/xml',
    },
    responseType: 'text',
  })
}

/**
 * Fetches the invoice status from the session, which includes the
 * `upoDownloadUrl` pre-signed URL when the UPO is ready.
 *
 * Uses `GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}`.
 */
export async function fetchInvoiceStatus(
  http: HttpClient,
  params: {
    accessToken: string
    sessionReferenceNumber: string
    invoiceReferenceNumber: string
  },
): Promise<InvoiceStatusResult> {
  const response = await http.request<RawInvoiceStatusResponse>({
    method: 'GET',
    path: PATHS.invoiceStatus(params.sessionReferenceNumber, params.invoiceReferenceNumber),
    headers: { Authorization: `Bearer ${params.accessToken}` },
  })

  const code = response.status?.code
  return {
    ksefNumber: response.ksefNumber ?? undefined,
    statusCode: code,
    statusDescription: response.status?.description,
    upoDownloadUrl: response.upoDownloadUrl ?? undefined,
    permanentStorageDate: response.permanentStorageDate ?? undefined,
  }
}

export function upoStatusFromCode(code: number | undefined): 'confirmed' | 'pending' | 'rejected' {
  if (code === undefined) return 'pending'
  if (code === 200) return 'confirmed'
  if (code >= 400) return 'rejected'
  return 'pending'
}

interface RawInvoiceStatusResponse {
  ksefNumber?: string | null
  status: { code: number; description: string; details?: string[] }
  upoDownloadUrl?: string | null
  permanentStorageDate?: string | null
}

export interface InvoiceStatusResult {
  ksefNumber?: string
  statusCode: number | undefined
  statusDescription?: string
  upoDownloadUrl?: string
  permanentStorageDate?: string
}
