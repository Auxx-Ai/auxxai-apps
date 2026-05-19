// src/tools/update-quickbooks-payment.tool.server.ts

import { getSyncToken, quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface UpdateQuickbooksPaymentInput {
  paymentId: string
  txnDate?: string
  paymentRefNum?: string
  privateNote?: string
}

interface UpdateQuickbooksPaymentOutput {
  paymentId: string
  totalAmt: number
  customerId: string
  syncToken: string
}

export default async function updateQuickbooksPayment(
  input: UpdateQuickbooksPaymentInput
): Promise<UpdateQuickbooksPaymentOutput> {
  const id = input.paymentId?.trim()
  if (!id) invalidInput('paymentId is required.')
  validateQbId(id, 'paymentId')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  for (let attempt = 0; attempt < 2; attempt++) {
    const { syncToken } = await getSyncToken(realmId, 'Payment', id, credential, { sandbox })

    const body: Record<string, unknown> = {
      Id: id,
      SyncToken: syncToken,
      sparse: true,
      ...(input.txnDate !== undefined && { TxnDate: input.txnDate }),
      ...(input.paymentRefNum !== undefined && { PaymentRefNum: input.paymentRefNum }),
      ...(input.privateNote !== undefined && { PrivateNote: input.privateNote }),
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await quickbooksApi<any>(realmId, '/payment?operation=update', credential, {
        method: 'POST',
        body,
        sandbox,
      })
      const raw = result.Payment
      return {
        paymentId: String(raw.Id),
        totalAmt: Number(raw.TotalAmt ?? 0),
        customerId: String(raw.CustomerRef?.value ?? ''),
        syncToken: String(raw.SyncToken ?? '0'),
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (attempt === 0 && /5010|stale|StaleObject/i.test(msg)) continue
      if (/5010|stale|StaleObject/i.test(msg)) {
        const e = new Error(
          'QuickBooks payment was modified concurrently. Re-fetch and retry.'
        ) as Error & { code: string }
        e.code = 'CONCURRENT_UPDATE'
        throw e
      }
      throw err
    }
  }
  throw new Error('unreachable')
}
