// src/tools/get_authorize_net_transaction.tool.server.ts

import { getAuthorizeNetCredentials } from './shared/connection'
import { projectTransactionDetail } from './shared/projections'
import { fetchTransactionDetails } from './shared/settlements'

interface GetAuthorizeNetTransactionInput {
  transId: string
}

export default async function getAuthorizeNetTransaction(input: GetAuthorizeNetTransactionInput) {
  const credentials = getAuthorizeNetCredentials()
  const raw = await fetchTransactionDetails({ credentials, transId: input.transId })

  // `billTo`, `shipTo` and `customer` come back here and the projection drops them — a
  // tool result is agent context.
  const detail = projectTransactionDetail(raw)
  if (!detail) {
    throw new Error(`Authorize.net returned no readable transaction for ${input.transId}`)
  }

  const summary =
    `Authorize.net transaction ${detail.transId}, ${detail.type}, status ${detail.status}` +
    (detail.settleAmount
      ? `, settled ${detail.settleAmount} ${detail.currency}`
      : detail.authAmount
        ? `, authorised ${detail.authAmount} ${detail.currency} and not yet settled`
        : '') +
    (detail.batchId
      ? ` in batch ${detail.batchId} (${detail.batchState ?? 'state unknown'})`
      : '') +
    '. ' +
    (detail.invoiceNumber ? `Invoice ${detail.invoiceNumber}. ` : 'No invoice number. ') +
    (detail.cardType && detail.cardNumber ? `${detail.cardType} ${detail.cardNumber}. ` : '') +
    'No fee is stated on a transaction — card fees arrive on the acquirer’s monthly statement.'

  return { summary, ...detail }
}
