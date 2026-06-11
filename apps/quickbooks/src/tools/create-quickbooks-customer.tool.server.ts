// src/tools/create-quickbooks-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  buildAddress,
  buildEmail,
  buildPhone,
  quickbooksApi,
} from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface CreateQuickbooksCustomerInput {
  displayName: string
  givenName?: string
  familyName?: string
  companyName?: string
  email?: string
  phone?: string
  billingAddress?: {
    line1?: string
    city?: string
    postalCode?: string
    state?: string
  }
  taxable?: boolean
}

interface CreateQuickbooksCustomerOutput {
  customerId: string
  displayName: string
  syncToken: string
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function createQuickbooksCustomer(
  input: CreateQuickbooksCustomerInput,
  ctx: ToolExecuteContext
): Promise<CreateQuickbooksCustomerOutput> {
  const displayName = input.displayName?.trim()
  if (!displayName) invalidInput('displayName is required.')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    DisplayName: displayName,
    ...(input.givenName && { GivenName: input.givenName }),
    ...(input.familyName && { FamilyName: input.familyName }),
    ...(input.companyName && { CompanyName: input.companyName }),
    ...(input.taxable !== undefined && { Taxable: input.taxable }),
  }

  const email = buildEmail(input.email)
  if (email) body.PrimaryEmailAddr = email
  const phone = buildPhone(input.phone)
  if (phone) body.PrimaryPhone = phone
  if (input.billingAddress) {
    const addr = buildAddress(input.billingAddress)
    if (addr) body.BillAddr = addr
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/customer', credential, {
    method: 'POST',
    body,
    sandbox,
  })
  const raw = result.Customer
  const refsResolved = await resolveCustomerRefs(raw)

  return {
    customerId: String(raw.Id),
    displayName: raw.DisplayName,
    syncToken: String(raw.SyncToken ?? '0'),
    auxxContactId: refsResolved.auxxContactId,
    auxxCompanyId: refsResolved.auxxCompanyId,
    notImportedReason: refsResolved.notImportedReason,
  }
}
