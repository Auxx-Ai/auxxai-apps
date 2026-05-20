// src/tools/internal/payment-delete.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('delete', input as Record<string, any>)
}
