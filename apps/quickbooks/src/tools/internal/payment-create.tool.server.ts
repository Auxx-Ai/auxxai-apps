// src/tools/internal/payment-create.tool.server.ts

import { executePayment } from '../../blocks/quickbooks/resources/payment/payment-execute.server'

export default async function paymentCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePayment('create', input as Record<string, any>)
}
