// src/tools/find-quickbooks-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapCustomerDetail, type MappedCustomerDetail } from './shared/map-customer'
import { quoteQqlString } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface FindQuickbooksCustomerInput {
  email?: string
  displayName?: string
}

interface FindQuickbooksCustomerOutput {
  found: boolean
  customer:
    | (MappedCustomerDetail & {
        auxxContactId: string | null
        auxxCompanyId: string | null
      })
    | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function findQuickbooksCustomer(
  input: FindQuickbooksCustomerInput,
  ctx: ToolExecuteContext
): Promise<FindQuickbooksCustomerOutput> {
  // .refine() XOR re-check (converter strips it).
  if (Number(!!input.email) + Number(!!input.displayName) !== 1) {
    invalidInput('Provide exactly one of email or displayName.')
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const where = input.email
    ? `PrimaryEmailAddr = ${quoteQqlString(input.email)}`
    : `DisplayName = ${quoteQqlString(input.displayName!)}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = await quickbooksQuery<any>(realmId, 'Customer', credential, {
    where,
    limit: 1,
    sandbox,
  })

  if (matches.length === 0) {
    return { found: false, customer: null, notImportedReason: null }
  }

  const raw = matches[0]
  const mapped = mapCustomerDetail(raw)
  const refs = await resolveCustomerRefs(raw)

  return {
    found: true,
    customer: {
      ...mapped,
      auxxContactId: refs.auxxContactId,
      auxxCompanyId: refs.auxxCompanyId,
    },
    notImportedReason: refs.notImportedReason,
  }
}
