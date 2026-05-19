// src/tools/search-quickbooks-payments.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapPaymentSummary, type MappedPaymentSummary } from './shared/map-payment'
import { joinWhere, quoteQqlString, validateIsoDate, validateQbId } from './shared/qql-builder'

interface SearchQuickbooksPaymentsInput {
  customerId?: string
  since?: string
  until?: string
  limit?: number
}

interface SearchQuickbooksPaymentsOutput {
  payments: MappedPaymentSummary[]
  hasMore: boolean
}

export default async function searchQuickbooksPayments(
  input: SearchQuickbooksPaymentsInput
): Promise<SearchQuickbooksPaymentsOutput> {
  const limit = input.limit ?? 20
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const clauses: (string | null)[] = []
  if (input.customerId) {
    validateQbId(input.customerId, 'customerId')
    clauses.push(`CustomerRef = ${quoteQqlString(input.customerId)}`)
  }
  if (input.since)
    clauses.push(`TxnDate >= ${quoteQqlString(validateIsoDate(input.since, 'since'))}`)
  if (input.until)
    clauses.push(`TxnDate <= ${quoteQqlString(validateIsoDate(input.until, 'until'))}`)

  const where = joinWhere(clauses)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Payment', credential, {
    where,
    limit: limit + 1,
    sandbox,
  })

  const hasMore = raw.length > limit
  const trimmed = hasMore ? raw.slice(0, limit) : raw

  return { payments: trimmed.map(mapPaymentSummary), hasMore }
}
