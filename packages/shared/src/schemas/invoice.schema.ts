import { z } from 'zod'
import { nipSchema } from './helpers.js'

export const LineItemSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1),
  unit: z.string().optional(),
  quantity: z.number().positive().optional(),
  unitNetPrice: z.number().int().optional(),
  netAmount: z.number().int().positive(),
  vatRate: z.number().int().min(0).max(100).optional(),
})

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  sellerNIP: nipSchema,
  buyerNIP: nipSchema.optional(),
  grossAmount: z.number().int().nonnegative(),
  netAmount: z.number().int().positive().optional(),
  vatAmount: z.number().int().nonnegative().optional(),
  currency: z.literal('PLN'),
  issueDate: z.string().date(),
  salesDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  ksefReference: z.string().optional(),
  sellerName: z.string().optional(),
  buyerName: z.string().optional(),
  description: z.string().optional(),
  lineItems: z.array(LineItemSchema).optional(),
  rawXml: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type Invoice = z.infer<typeof InvoiceSchema>
export type LineItem = z.infer<typeof LineItemSchema>
