// src/tools/internal/invoice-get.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('get', input as Record<string, any>)
}
