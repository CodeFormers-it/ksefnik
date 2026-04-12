// Pre-compiled smoke test — runs the compiled dist so no tsx/ts-node is required.
// Usage: node --env-file=.env packages/http/scripts/smoke-test.mjs
import { readFileSync } from 'node:fs'
import { KsefHttpClient } from '../dist/client.js'

function required(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`[smoke] Missing env: ${name}`)
    process.exit(2)
  }
  return value
}

async function main() {
  const nip = required('KSEF_TEST_NIP')
  const token = required('KSEF_TEST_TOKEN')

  const pemPath = process.env['KSEF_TEST_PUBLIC_KEY_PATH']
  const publicKeyPem = pemPath ? readFileSync(pemPath, 'utf8') : undefined

  const envName = process.env['KSEF_ENV'] ?? 'test'

  const client = new KsefHttpClient({
    environment: envName,
    publicKeyPem,
  })

  console.log(`[smoke] NIP=${nip}  env=${envName}`)
  console.log(
    pemPath
      ? `[smoke] publicKeyPem: pinned from ${pemPath}`
      : '[smoke] publicKeyPem: auto-fetch from GET /security/public-key-certificates',
  )

  console.log('[smoke] initSession…')
  const session = await client.initSession({ nip, environment: envName, token })
  console.log(
    `[smoke] session OK: ref=${session.referenceNumber} expires=${session.expiresAt.toISOString()}`,
  )

  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 60)
  const toYMD = (d) => d.toISOString().slice(0, 10)

  console.log(`[smoke] fetchInvoices ${toYMD(from)}..${toYMD(now)}…`)
  const { invoices, total } = await client.fetchInvoices({
    token: session.token,
    dateFrom: toYMD(from),
    dateTo: toYMD(now),
    pageSize: 10,
  })
  console.log(`[smoke] invoices fetched: ${invoices.length} (total reported: ${total})`)
  for (const inv of invoices.slice(0, 10)) {
    console.log(
      `  - ${inv.ksefReferenceNumber}  ${inv.invoiceNumber}  ${inv.subjectNip}  ${inv.invoicingDate}`,
    )
  }

  console.log('[smoke] terminateSession…')
  await client.terminateSession(session.token)
  console.log('[smoke] OK')
}

main().catch((error) => {
  console.error('[smoke] FAILED:', error)
  if (error instanceof Error && error.stack) console.error(error.stack)
  process.exit(1)
})
