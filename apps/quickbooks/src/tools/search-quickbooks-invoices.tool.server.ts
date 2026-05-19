// src/tools/search-quickbooks-invoices.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapInvoiceSummary, type MappedInvoiceSummary } from './shared/map-invoice'
import {
  joinWhere,
  quoteQqlString,
  todayIso,
  validateIsoDate,
  validateQbId,
} from './shared/qql-builder'

interface SearchQuickbooksInvoicesInput {
  customerId?: string
  status?: 'open' | 'paid' | 'overdue' | 'voided' | 'all'
  since?: string
  until?: string
  limit?: number
}

interface SearchQuickbooksInvoicesOutput {
  invoices: MappedInvoiceSummary[]
  hasMore: boolean
}

export default async function searchQuickbooksInvoices(
  input: SearchQuickbooksInvoicesInput
): Promise<SearchQuickbooksInvoicesOutput> {
  const limit = input.limit ?? 20
  const status = input.status ?? 'all'

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

  if (status === 'open') clauses.push('Balance > 0')
  if (status === 'paid') clauses.push('Balance = 0')
  if (status === 'overdue') {
    clauses.push('Balance > 0')
    clauses.push(`DueDate < ${quoteQqlString(todayIso())}`)
  }

  const where = joinWhere(clauses)

  // 'voided' filter is post-fetch — QQL doesn't expose PrintStatus reliably.
  const fetchLimit = status === 'voided' ? Math.min(limit * 5, 200) : limit + 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Invoice', credential, {
    where,
    limit: fetchLimit,
    sandbox,
  })

  const mapped = raw.map(mapInvoiceSummary)
  const filtered =
    status === 'voided'
      ? mapped.filter((m) => m.status === 'Voided')
      : status === 'all'
        ? mapped
        : mapped

  const hasMore = filtered.length > limit
  const trimmed = hasMore ? filtered.slice(0, limit) : filtered

  return { invoices: trimmed, hasMore }
}
