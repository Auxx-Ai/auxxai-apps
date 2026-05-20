// src/tools/internal/payment-update.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('update', input as Record<string, any>)
}
