// src/tools/internal/invoice-send.tool.server.ts

import { executeInvoice } from '../../blocks/quickbooks/resources/invoice/invoice-execute.server'

export default async function invoiceSend(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeInvoice('send', input as Record<string, any>)
}
