import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  getSyncToken,
  throwConnectionNotFound,
  buildAddress,
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

export async function executeCustomer(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const displayName = input.createCustomerDisplayName?.trim()
      if (!displayName)
        throw new BlockValidationError([
          { field: 'createCustomerDisplayName', message: 'Display name is required.' },
        ])

      const body: Record<string, any> = {
        DisplayName: displayName,
        ...(input.createCustomerGivenName && { GivenName: input.createCustomerGivenName }),
        ...(input.createCustomerFamilyName && { FamilyName: input.createCustomerFamilyName }),
        ...(input.createCustomerCompanyName && { CompanyName: input.createCustomerCompanyName }),
        ...(input.createCustomerTaxable !== undefined && { Taxable: input.createCustomerTaxable }),
        ...(input.createCustomerPreferredDeliveryMethod &&
          input.createCustomerPreferredDeliveryMethod !== 'None' && {
            PreferredDeliveryMethod: input.createCustomerPreferredDeliveryMethod,
          }),
      }

      const email = buildEmail(input.createCustomerEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.createCustomerPhone)
      if (phone) body.PrimaryPhone = phone

      const addr = buildAddress({
        line1: input.createCustomerBillAddrLine1,
        city: input.createCustomerBillAddrCity,
        postalCode: input.createCustomerBillAddrPostalCode,
        state: input.createCustomerBillAddrState,
      })
      if (addr) body.BillAddr = addr

      const result = await quickbooksApi<any>(realmId, '/customer', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const customer = result.Customer
      return {
        customerId: customer.Id,
        displayName: customer.DisplayName,
        syncToken: customer.SyncToken,
      }
    }

    case 'get': {
      const id = input.getCustomerId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getCustomerId', message: 'Customer ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/customer/${id}`, credential, { sandbox })
      const c = result.Customer

      return {
        customerId: c.Id,
        displayName: c.DisplayName ?? '',
        givenName: c.GivenName ?? '',
        familyName: c.FamilyName ?? '',
        companyName: c.CompanyName ?? '',
        email: c.PrimaryEmailAddr?.Address ?? '',
        phone: c.PrimaryPhone?.FreeFormNumber ?? '',
        balance: String(c.Balance ?? 0),
        active: String(c.Active ?? true),
        raw: c,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyCustomerReturnAll === true
      const limit = Number(input.getManyCustomerLimit) || 50
      const where = input.getManyCustomerQuery?.trim() || undefined

      const customers = await quickbooksQuery<any>(realmId, 'Customer', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        customers: customers,
        count: String(customers.length),
      }
    }

    case 'update': {
      const id = input.updateCustomerId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateCustomerId', message: 'Customer ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Customer', id, credential, { sandbox })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
        ...(input.updateCustomerDisplayName && { DisplayName: input.updateCustomerDisplayName }),
        ...(input.updateCustomerGivenName && { GivenName: input.updateCustomerGivenName }),
        ...(input.updateCustomerFamilyName && { FamilyName: input.updateCustomerFamilyName }),
        ...(input.updateCustomerCompanyName && { CompanyName: input.updateCustomerCompanyName }),
      }

      const email = buildEmail(input.updateCustomerEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.updateCustomerPhone)
      if (phone) body.PrimaryPhone = phone

      const addr = buildAddress({
        line1: input.updateCustomerBillAddrLine1,
        city: input.updateCustomerBillAddrCity,
        postalCode: input.updateCustomerBillAddrPostalCode,
        state: input.updateCustomerBillAddrState,
      })
      if (addr) body.BillAddr = addr

      const result = await quickbooksApi<any>(realmId, '/customer', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const c = result.Customer
      return {
        customerId: c.Id,
        displayName: c.DisplayName ?? '',
        givenName: c.GivenName ?? '',
        familyName: c.FamilyName ?? '',
        companyName: c.CompanyName ?? '',
        email: c.PrimaryEmailAddr?.Address ?? '',
        phone: c.PrimaryPhone?.FreeFormNumber ?? '',
        balance: String(c.Balance ?? 0),
        active: String(c.Active ?? true),
        raw: c,
      }
    }

    default:
      throw new Error(`Unknown customer operation: ${operation}`)
  }
}
