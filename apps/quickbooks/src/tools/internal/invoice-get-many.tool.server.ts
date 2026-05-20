// src/tools/internal/invoice-get-many.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('getMany', input as Record<string, any>)
}
