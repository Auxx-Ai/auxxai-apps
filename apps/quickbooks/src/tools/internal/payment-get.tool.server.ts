// src/tools/internal/payment-get.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('get', input as Record<string, any>)
}
