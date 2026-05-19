// src/tools/create-quickbooks-estimate.tool.server.ts

import { processLineItems } from '../blocks/quickbooks/shared/process-lines'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface EstimateLine {
  itemId: string
  amount: number
  quantity?: number
  description?: string
}

interface CreateQuickbooksEstimateInput {
  customerId: string
  lines: EstimateLine[]
  docNumber?: string
  expirationDate?: string
  txnDate?: string
  billEmail?: string
  customerMemo?: string
}

interface CreateQuickbooksEstimateOutput {
  estimateId: string
  docNumber: string | null
  totalAmt: number
  syncToken: string
}

export default async function createQuickbooksEstimate(
  input: CreateQuickbooksEstimateInput
): Promise<CreateQuickbooksEstimateOutput> {
  validateQbId(input.customerId, 'customerId')
  if (!input.lines?.length) invalidInput('lines must contain at least one item.')
  for (const line of input.lines) validateQbId(line.itemId, 'lines[].itemId')
  if (input.expirationDate) validateIsoDate(input.expirationDate, 'expirationDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    Line: processLineItems(
      input.lines.map((l) => ({ ...l, quantity: l.quantity ?? 1 })),
      'estimate'
    ),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.expirationDate && { ExpirationDate: input.expirationDate }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.billEmail && { BillEmail: { Address: input.billEmail } }),
    ...(input.customerMemo && { CustomerMemo: { value: input.customerMemo } }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/estimate', credential, {
    method: 'POST',
    body,
    sandbox,
  })
  const raw = result.Estimate
  return {
    estimateId: String(raw.Id),
    docNumber: raw.DocNumber ?? null,
    totalAmt: Number(raw.TotalAmt ?? 0),
    syncToken: String(raw.SyncToken ?? '0'),
  }
}
