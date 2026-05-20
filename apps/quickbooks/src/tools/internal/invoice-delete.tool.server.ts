// src/tools/internal/invoice-delete.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('delete', input as Record<string, any>)
}
