// src/tools/internal/payment-send.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentSend(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('send', input as Record<string, any>)
}
