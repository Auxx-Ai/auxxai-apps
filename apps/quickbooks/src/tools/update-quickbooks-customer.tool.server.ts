// src/tools/update-quickbooks-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  buildAddress,
  buildEmail,
  buildPhone,
  getSyncToken,
  quickbooksApi,
} from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateQbId } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface UpdateQuickbooksCustomerInput {
  customerId: string
  displayName?: string
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

interface UpdateQuickbooksCustomerOutput {
  customerId: string
  displayName: string
  syncToken: string
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBody(
  id: string,
  syncToken: string,
  input: UpdateQuickbooksCustomerInput
): Record<string, any> {
  const body: Record<string, unknown> = {
    Id: id,
    SyncToken: syncToken,
    sparse: true,
    ...(input.displayName !== undefined && { DisplayName: input.displayName }),
    ...(input.givenName !== undefined && { GivenName: input.givenName }),
    ...(input.familyName !== undefined && { FamilyName: input.familyName }),
    ...(input.companyName !== undefined && { CompanyName: input.companyName }),
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
  return body
}

export default async function updateQuickbooksCustomer(
  input: UpdateQuickbooksCustomerInput,
  ctx: ToolExecuteContext
): Promise<UpdateQuickbooksCustomerOutput> {
  const id = input.customerId?.trim()
  if (!id) invalidInput('customerId is required.')
  validateQbId(id, 'customerId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // SyncToken-aware update: fetch current → POST sparse update. Retry once
  // on stale-object (code 5010); throw CONCURRENT_UPDATE on double-conflict.
  // See plans/kopilot/apps/quickbooks-overhaul.md §7.4.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { syncToken } = await getSyncToken(realmId, 'Customer', id, credential, { sandbox })
    const body = buildBody(id, syncToken, input)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await quickbooksApi<any>(realmId, '/customer?operation=update', credential, {
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
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (attempt === 0 && /5010|stale|StaleObject/i.test(msg)) continue
      if (/5010|stale|StaleObject/i.test(msg)) {
        const e = new Error(
          'QuickBooks customer was modified concurrently. Re-fetch and retry.'
        ) as Error & { code: string }
        e.code = 'CONCURRENT_UPDATE'
        throw e
      }
      throw err
    }
  }
  throw new Error('unreachable')
}
