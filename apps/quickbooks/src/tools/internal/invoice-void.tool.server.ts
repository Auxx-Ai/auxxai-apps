// src/tools/internal/invoice-void.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceVoid(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('void', input as Record<string, any>)
}
