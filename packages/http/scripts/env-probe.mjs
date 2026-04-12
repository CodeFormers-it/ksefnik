// Probe which environment (test/demo/production) a KSeF token belongs to.
// Runs the full auth flow up to the redeem step for each env and reports.
// Usage: node --env-file=.env packages/http/scripts/env-probe.mjs
import { KsefHttpClient } from '../dist/client.js'

const NIP = process.env.KSEF_TEST_NIP
const TOKEN = process.env.KSEF_TEST_TOKEN
if (!NIP || !TOKEN) {
  console.error('Missing KSEF_TEST_NIP / KSEF_TEST_TOKEN')
  process.exit(2)
}

for (const env of ['test', 'demo', 'production']) {
  const client = new KsefHttpClient({ environment: env })
  process.stdout.write(`[probe] env=${env.padEnd(10)} `)
  try {
    const session = await client.initSession({ nip: NIP, environment: env, token: TOKEN })
    console.log(`OK  ref=${session.referenceNumber}`)
    await client.terminateSession(session.token)
    console.log(`       ✅ token is valid for ${env}`)
    break
  } catch (error) {
    const code = error?.statusCode ?? '-'
    const msg = (error?.message ?? String(error)).split('\n')[0].slice(0, 180)
    console.log(`FAIL status=${code}  ${msg}`)
  }
}
