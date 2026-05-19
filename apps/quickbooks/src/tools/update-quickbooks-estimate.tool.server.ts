// src/tools/update-quickbooks-estimate.tool.server.ts

import { processLineItems } from '../blocks/quickbooks/shared/process-lines'
import { getSyncToken, quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface UpdateQuickbooksEstimateInput {
  estimateId: string
  lines?: {
    itemId: string
    amount: number
    quantity?: number
    description?: string
  }[]
  docNumber?: string
  expirationDate?: string
  txnDate?: string
  billEmail?: string
  customerMemo?: string
}

interface UpdateQuickbooksEstimateOutput {
  estimateId: string
  docNumber: string | null
  totalAmt: number
  syncToken: string
}

export default async function updateQuickbooksEstimate(
  input: UpdateQuickbooksEstimateInput
): Promise<UpdateQuickbooksEstimateOutput> {
  const id = input.estimateId?.trim()
  if (!id) invalidInput('estimateId is required.')
  validateQbId(id, 'estimateId')
  if (input.lines) for (const line of input.lines) validateQbId(line.itemId, 'lines[].itemId')
  if (input.expirationDate) validateIsoDate(input.expirationDate, 'expirationDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  for (let attempt = 0; attempt < 2; attempt++) {
    const { syncToken } = await getSyncToken(realmId, 'Estimate', id, credential, { sandbox })

    const body: Record<string, unknown> = {
      Id: id,
      SyncToken: syncToken,
      sparse: true,
      ...(input.lines && {
        Line: processLineItems(
          input.lines.map((l) => ({ ...l, quantity: l.quantity ?? 1 })),
          'estimate'
        ),
      }),
      ...(input.docNumber !== undefined && { DocNumber: input.docNumber }),
      ...(input.expirationDate !== undefined && { ExpirationDate: input.expirationDate }),
      ...(input.txnDate !== undefined && { TxnDate: input.txnDate }),
      ...(input.billEmail !== undefined && { BillEmail: { Address: input.billEmail } }),
      ...(input.customerMemo !== undefined && { CustomerMemo: { value: input.customerMemo } }),
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await quickbooksApi<any>(realmId, '/estimate?operation=update', credential, {
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
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (attempt === 0 && /5010|stale|StaleObject/i.test(msg)) continue
      if (/5010|stale|StaleObject/i.test(msg)) {
        const e = new Error(
          'QuickBooks estimate was modified concurrently. Re-fetch and retry.'
        ) as Error & { code: string }
        e.code = 'CONCURRENT_UPDATE'
        throw e
      }
      throw err
    }
  }
  throw new Error('unreachable')
}
