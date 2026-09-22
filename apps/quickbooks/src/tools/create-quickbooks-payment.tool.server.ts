// src/tools/create-quickbooks-payment.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import {
  type CreatePaymentInput,
  type CreatePaymentOutput,
  buildPaymentBody,
  mapCreatedPayment,
} from './shared/native-creates'

export default async function createQuickbooksPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentOutput> {
  const body = buildPaymentBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/payment', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedPayment(result.Payment)
}
