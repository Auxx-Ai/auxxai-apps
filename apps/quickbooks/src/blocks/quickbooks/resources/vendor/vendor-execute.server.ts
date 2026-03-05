import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  getSyncToken,
  throwConnectionNotFound,
  buildEmail,
  buildPhone,
} from '../../shared/quickbooks-api'

async function getConnectionAndRealm() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const realmId = connection.metadata?.realmId
  if (!realmId) throw new Error('QuickBooks realm ID not found. Please reconnect.')
  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true
  return { credential: connection.value, realmId, sandbox }
}

export async function executeVendor(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const displayName = input.createVendorDisplayName?.trim()
      if (!displayName)
        throw new BlockValidationError([
          { field: 'createVendorDisplayName', message: 'Display name is required.' },
        ])

      const body: Record<string, any> = {
        DisplayName: displayName,
        ...(input.createVendorGivenName && { GivenName: input.createVendorGivenName }),
        ...(input.createVendorFamilyName && { FamilyName: input.createVendorFamilyName }),
        ...(input.createVendorCompanyName && { CompanyName: input.createVendorCompanyName }),
        ...(input.createVendorAcctNum && { AcctNum: input.createVendorAcctNum }),
        ...(input.createVendorVendor1099 !== undefined && {
          Vendor1099: input.createVendorVendor1099,
        }),
      }

      const email = buildEmail(input.createVendorEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.createVendorPhone)
      if (phone) body.PrimaryPhone = phone

      const result = await quickbooksApi<any>(realmId, '/vendor', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const vendor = result.Vendor
      return {
        vendorId: vendor.Id,
        displayName: vendor.DisplayName,
        syncToken: vendor.SyncToken,
      }
    }

    case 'get': {
      const id = input.getVendorId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getVendorId', message: 'Vendor ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/vendor/${id}`, credential, { sandbox })
      const v = result.Vendor

      return {
        vendorId: v.Id,
        displayName: v.DisplayName ?? '',
        givenName: v.GivenName ?? '',
        familyName: v.FamilyName ?? '',
        companyName: v.CompanyName ?? '',
        email: v.PrimaryEmailAddr?.Address ?? '',
        phone: v.PrimaryPhone?.FreeFormNumber ?? '',
        balance: String(v.Balance ?? 0),
        active: String(v.Active ?? true),
        raw: v,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyVendorReturnAll === true
      const limit = Number(input.getManyVendorLimit) || 50
      const where = input.getManyVendorQuery?.trim() || undefined

      const vendors = await quickbooksQuery<any>(realmId, 'Vendor', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        vendors: vendors,
        count: String(vendors.length),
      }
    }

    case 'update': {
      const id = input.updateVendorId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateVendorId', message: 'Vendor ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Vendor', id, credential, { sandbox })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
        ...(input.updateVendorDisplayName && { DisplayName: input.updateVendorDisplayName }),
        ...(input.updateVendorGivenName && { GivenName: input.updateVendorGivenName }),
        ...(input.updateVendorFamilyName && { FamilyName: input.updateVendorFamilyName }),
        ...(input.updateVendorCompanyName && { CompanyName: input.updateVendorCompanyName }),
        ...(input.updateVendorAcctNum && { AcctNum: input.updateVendorAcctNum }),
        ...(input.updateVendorVendor1099 !== undefined && {
          Vendor1099: input.updateVendorVendor1099,
        }),
      }

      const email = buildEmail(input.updateVendorEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.updateVendorPhone)
      if (phone) body.PrimaryPhone = phone

      const result = await quickbooksApi<any>(realmId, '/vendor', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const v = result.Vendor
      return {
        vendorId: v.Id,
        displayName: v.DisplayName ?? '',
        givenName: v.GivenName ?? '',
        familyName: v.FamilyName ?? '',
        companyName: v.CompanyName ?? '',
        email: v.PrimaryEmailAddr?.Address ?? '',
        phone: v.PrimaryPhone?.FreeFormNumber ?? '',
        balance: String(v.Balance ?? 0),
        active: String(v.Active ?? true),
        raw: v,
      }
    }

    default:
      throw new Error(`Unknown vendor operation: ${operation}`)
  }
}
