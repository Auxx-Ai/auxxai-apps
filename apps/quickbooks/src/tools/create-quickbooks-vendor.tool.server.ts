// src/tools/create-quickbooks-vendor.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  buildAddress,
  buildEmail,
  buildPhone,
  quickbooksApi,
} from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { resolveVendorRef } from './shared/resolve-vendor-ref'

interface CreateQuickbooksVendorInput {
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
  acctNum?: string
  vendor1099?: boolean
}

interface CreateQuickbooksVendorOutput {
  vendorId: string
  displayName: string
  syncToken: string
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function createQuickbooksVendor(
  input: CreateQuickbooksVendorInput,
  ctx: ToolExecuteContext
): Promise<CreateQuickbooksVendorOutput> {
  const displayName = input.displayName?.trim()
  if (!displayName) invalidInput('displayName is required.')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    DisplayName: displayName,
    ...(input.givenName && { GivenName: input.givenName }),
    ...(input.familyName && { FamilyName: input.familyName }),
    ...(input.companyName && { CompanyName: input.companyName }),
    ...(input.acctNum && { AcctNum: input.acctNum }),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/vendor', credential, {
    method: 'POST',
    body,
    sandbox,
  })
  const raw = result.Vendor
  const vendorId = String(raw.Id)
  const auxxCompanyId = await resolveVendorRef(ctx, vendorId)

  return {
    vendorId,
    displayName: raw.DisplayName,
    syncToken: String(raw.SyncToken ?? '0'),
    auxxCompanyId,
    notImportedReason: auxxCompanyId ? null : 'NOT_IMPORTED',
  }
}
