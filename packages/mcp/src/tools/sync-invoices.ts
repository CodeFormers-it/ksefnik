import type { Ksefnik } from '@ksefnik/core'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, isAbsolute, join } from 'node:path'
import { z } from 'zod'

export const syncInvoicesSchema = z.object({
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
  nip: z.string().optional(),
  /**
   * `sales` = invoices issued by this company (Subject1 on KSeF side),
   * `cost`  = invoices received by this company (Subject2).
   * Defaults to `cost` for backwards compatibility with the MVP.
   */
  subject: z.enum(['sales', 'cost']).optional(),
  /**
   * When provided, downloads the full FA(2)/FA(3) XML for each invoice and
   * saves it to `${saveDir}/${ksefReference}.xml`. Path must be absolute.
   * Creates the directory if it doesn't exist.
   */
  saveDir: z.string().optional(),
})

export type SyncInvoicesInput = z.infer<typeof syncInvoicesSchema>

export async function syncInvoices(ksef: Ksefnik, input: SyncInvoicesInput) {
  const subjectType = input.subject === 'sales' ? 'Subject1' : 'Subject2'
  const includeXml = Boolean(input.saveDir)

  const invoices = await ksef.invoices.fetch({
    from: input.dateFrom,
    to: input.dateTo,
    nip: input.nip,
    subjectType,
    includeXml,
  })

  let savedFiles: string[] = []
  if (input.saveDir) {
    const dir = isAbsolute(input.saveDir) ? input.saveDir : resolve(input.saveDir)
    await mkdir(dir, { recursive: true })
    savedFiles = await Promise.all(
      invoices
        .filter((inv) => inv.ksefReference && inv.rawXml)
        .map(async (inv) => {
          const path = join(dir, `${inv.ksefReference}.xml`)
          await writeFile(path, inv.rawXml ?? '', 'utf8')
          return path
        }),
    )
  }

  return {
    invoices,
    count: invoices.length,
    subject: input.subject ?? 'cost',
    savedFiles: input.saveDir ? savedFiles : undefined,
    savedCount: input.saveDir ? savedFiles.length : undefined,
  }
}
