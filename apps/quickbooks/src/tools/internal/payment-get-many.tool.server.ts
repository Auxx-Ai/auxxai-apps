// src/tools/internal/payment-get-many.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('getMany', input as Record<string, any>)
}
