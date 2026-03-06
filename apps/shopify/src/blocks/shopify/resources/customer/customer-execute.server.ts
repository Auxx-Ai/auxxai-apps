// src/blocks/shopify/resources/customer/customer-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApi, throwConnectionNotFound, getShopDomain } from '../../shared/shopify-api'

function getConnectionInfo() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return {
    token: connection.value,
    shopDomain: getShopDomain(connection.metadata),
  }
}

function decimalToCents(decimal: string | number): number {
  return Math.round(parseFloat(String(decimal)) * 100)
}

export async function executeCustomer(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const customer: any = {}
      if (input.createFirstName) customer.first_name = input.createFirstName
      if (input.createLastName) customer.last_name = input.createLastName
      if (input.createEmail) customer.email = input.createEmail
      if (input.createPhone) customer.phone = input.createPhone
      if (input.createTags) customer.tags = input.createTags
      if (input.createNote) customer.note = input.createNote
      if (input.createVerifiedEmail != null) customer.verified_email = input.createVerifiedEmail
      if (input.createSendEmailInvite) customer.send_email_invite = true
      if (input.createTaxExempt) customer.tax_exempt = true

      const address: any = {}
      if (input.createAddress1) address.address1 = input.createAddress1
      if (input.createAddress2) address.address2 = input.createAddress2
      if (input.createCity) address.city = input.createCity
      if (input.createProvince) address.province = input.createProvince
      if (input.createCountry) address.country = input.createCountry
      if (input.createZip) address.zip = input.createZip
      if (input.createCompany) address.company = input.createCompany
      if (Object.keys(address).length > 0) customer.addresses = [address]

      const result = await shopifyApi<{ customer: any }>(shopDomain, token, '/customers.json', {
        method: 'POST',
        body: { customer },
      })
      return { customer: mapCustomerResponse(result.customer) }
    }

    case 'update': {
      const customer: any = {}
      if (input.updateFirstName) customer.first_name = input.updateFirstName
      if (input.updateLastName) customer.last_name = input.updateLastName
      if (input.updateEmail) customer.email = input.updateEmail
      if (input.updatePhone) customer.phone = input.updatePhone
      if (input.updateTags) customer.tags = input.updateTags
      if (input.updateNote) customer.note = input.updateNote
      if (input.updateTaxExempt === 'true') customer.tax_exempt = true
      else if (input.updateTaxExempt === 'false') customer.tax_exempt = false

      const result = await shopifyApi<{ customer: any }>(
        shopDomain,
        token,
        `/customers/${input.updateCustomerId}.json`,
        { method: 'PUT', body: { customer } }
      )
      return { customer: mapCustomerResponse(result.customer) }
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields?.length) qs.fields = input.getFields.join(',')

      const result = await shopifyApi<{ customer: any }>(
        shopDomain,
        token,
        `/customers/${input.getCustomerId}.json`,
        { qs }
      )
      return { customer: mapCustomerResponse(result.customer) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyCreatedAtMin) qs.created_at_min = input.getManyCreatedAtMin
      if (input.getManyCreatedAtMax) qs.created_at_max = input.getManyCreatedAtMax
      if (input.getManyUpdatedAtMin) qs.updated_at_min = input.getManyUpdatedAtMin
      if (input.getManyUpdatedAtMax) qs.updated_at_max = input.getManyUpdatedAtMax
      if (input.getManyFields?.length) qs.fields = input.getManyFields.join(',')

      const result = await shopifyApi<{ customers: any[] }>(shopDomain, token, '/customers.json', {
        qs,
      })
      const customers = (result.customers || []).map(mapCustomerResponse)
      return {
        customers,
        count: customers.length,
      }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/customers/${input.deleteCustomerId}.json`, {
        method: 'DELETE',
      })
      return { success: true }
    }

    case 'search': {
      const qs: Record<string, string> = {
        query: input.searchQuery || '',
        limit: input.searchLimit || '50',
      }

      const result = await shopifyApi<{ customers: any[] }>(
        shopDomain,
        token,
        '/customers/search.json',
        { qs }
      )
      const customers = (result.customers || []).map(mapCustomerResponse)
      return {
        customers,
        count: customers.length,
      }
    }

    default:
      throw new Error(`Unknown customer operation: ${operation}`)
  }
}

function mapCustomerResponse(customer: any) {
  return {
    customerId: String(customer.id ?? ''),
    firstName: customer.first_name || '',
    lastName: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    tags: customer.tags || '',
    note: customer.note || '',
    ordersCount: customer.orders_count ?? 0,
    totalSpent: decimalToCents(customer.total_spent || '0'),
    addresses: customer.addresses || [],
    createdAt: customer.created_at || '',
    updatedAt: customer.updated_at || '',
  }
}
