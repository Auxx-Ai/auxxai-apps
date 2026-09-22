// src/tools/create-quickbooks-invoice.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import {
  type CreateInvoiceInput,
  type CreateInvoiceOutput,
  buildInvoiceBody,
  mapCreatedInvoice,
} from './shared/native-creates'

export default async function createQuickbooksInvoice(
  input: CreateInvoiceInput
): Promise<CreateInvoiceOutput> {
  const body = buildInvoiceBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/invoice', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedInvoice(result.Invoice)
}
