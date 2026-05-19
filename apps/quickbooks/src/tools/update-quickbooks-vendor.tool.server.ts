// src/tools/update-quickbooks-vendor.tool.server.ts

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
import { resolveVendorRef } from './shared/resolve-vendor-ref'

interface UpdateQuickbooksVendorInput {
  vendorId: string
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
  acctNum?: string
  vendor1099?: boolean
}

interface UpdateQuickbooksVendorOutput {
  vendorId: string
  displayName: string
  syncToken: string
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBody(
  id: string,
  syncToken: string,
  input: UpdateQuickbooksVendorInput
): Record<string, any> {
  const body: Record<string, unknown> = {
    Id: id,
    SyncToken: syncToken,
    sparse: true,
    ...(input.displayName !== undefined && { DisplayName: input.displayName }),
    ...(input.givenName !== undefined && { GivenName: input.givenName }),
    ...(input.familyName !== undefined && { FamilyName: input.familyName }),
    ...(input.companyName !== undefined && { CompanyName: input.companyName }),
    ...(input.acctNum !== undefined && { AcctNum: input.acctNum }),
    ...(input.vendor1099 !== undefined && { Vendor1099: input.vendor1099 }),
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

export default async function updateQuickbooksVendor(
  input: UpdateQuickbooksVendorInput,
  ctx: ToolExecuteContext
): Promise<UpdateQuickbooksVendorOutput> {
  const id = input.vendorId?.trim()
  if (!id) invalidInput('vendorId is required.')
  validateQbId(id, 'vendorId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  for (let attempt = 0; attempt < 2; attempt++) {
    const { syncToken } = await getSyncToken(realmId, 'Vendor', id, credential, { sandbox })
    const body = buildBody(id, syncToken, input)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await quickbooksApi<any>(realmId, '/vendor?operation=update', credential, {
        method: 'POST',
        body,
        sandbox,
      })
      const raw = result.Vendor
      const auxxCompanyId = await resolveVendorRef(ctx, String(raw.Id))
      return {
        vendorId: String(raw.Id),
        displayName: raw.DisplayName,
        syncToken: String(raw.SyncToken ?? '0'),
        auxxCompanyId,
        notImportedReason: auxxCompanyId ? null : 'NOT_IMPORTED',
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (attempt === 0 && /5010|stale|StaleObject/i.test(msg)) continue
      if (/5010|stale|StaleObject/i.test(msg)) {
        const e = new Error(
          'QuickBooks vendor was modified concurrently. Re-fetch and retry.'
        ) as Error & { code: string }
        e.code = 'CONCURRENT_UPDATE'
        throw e
      }
      throw err
    }
  }
  throw new Error('unreachable')
}
