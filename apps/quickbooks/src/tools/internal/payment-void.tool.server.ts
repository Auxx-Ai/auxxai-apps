// src/tools/internal/payment-void.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentVoid(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('void', input as Record<string, any>)
}
