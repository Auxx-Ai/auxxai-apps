// src/tools/internal/invoice-update.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('update', input as Record<string, any>)
}
