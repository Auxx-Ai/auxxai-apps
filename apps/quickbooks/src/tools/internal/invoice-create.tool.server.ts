// src/tools/internal/invoice-create.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('create', input as Record<string, any>)
}
