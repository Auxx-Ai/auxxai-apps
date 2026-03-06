// src/blocks/shopify/resources/customer-address/customer-address-execute.server.ts

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

export async function executeCustomerAddress(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()
  const customerId = input.customerId

  switch (operation) {
    case 'create': {
      const address: any = {}
      if (input.createAddress1) address.address1 = input.createAddress1
      if (input.createAddress2) address.address2 = input.createAddress2
      if (input.createCity) address.city = input.createCity
      if (input.createProvince) address.province = input.createProvince
      if (input.createCountry) address.country = input.createCountry
      if (input.createZip) address.zip = input.createZip
      if (input.createPhone) address.phone = input.createPhone
      if (input.createCompany) address.company = input.createCompany
      if (input.createFirstName) address.first_name = input.createFirstName
      if (input.createLastName) address.last_name = input.createLastName

      const result = await shopifyApi<{ customer_address: any }>(
        shopDomain,
        token,
        `/customers/${customerId}/addresses.json`,
        { method: 'POST', body: { address } }
      )

      const addr = result.customer_address
      if (input.createIsDefault && addr?.id) {
        const defaultResult = await shopifyApi<{ customer_address: any }>(
          shopDomain,
          token,
          `/customers/${customerId}/addresses/${addr.id}/default.json`,
          { method: 'PUT' }
        )
        return { address: mapAddressResponse(defaultResult.customer_address) }
      }
      return { address: mapAddressResponse(addr) }
    }

    case 'update': {
      const address: any = {}
      if (input.updateAddress1) address.address1 = input.updateAddress1
      if (input.updateAddress2) address.address2 = input.updateAddress2
      if (input.updateCity) address.city = input.updateCity
      if (input.updateProvince) address.province = input.updateProvince
      if (input.updateCountry) address.country = input.updateCountry
      if (input.updateZip) address.zip = input.updateZip
      if (input.updatePhone) address.phone = input.updatePhone
      if (input.updateCompany) address.company = input.updateCompany
      if (input.updateFirstName) address.first_name = input.updateFirstName
      if (input.updateLastName) address.last_name = input.updateLastName

      const result = await shopifyApi<{ customer_address: any }>(
        shopDomain,
        token,
        `/customers/${customerId}/addresses/${input.updateAddressId}.json`,
        { method: 'PUT', body: { address } }
      )
      return { address: mapAddressResponse(result.customer_address) }
    }

    case 'get': {
      const result = await shopifyApi<{ customer_address: any }>(
        shopDomain,
        token,
        `/customers/${customerId}/addresses/${input.getAddressId}.json`
      )
      return { address: mapAddressResponse(result.customer_address) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }

      const result = await shopifyApi<{ addresses: any[] }>(
        shopDomain,
        token,
        `/customers/${customerId}/addresses.json`,
        { qs }
      )
      const addresses = (result.addresses || []).map(mapAddressResponse)
      return {
        addresses,
        count: addresses.length,
      }
    }

    case 'delete': {
      await shopifyApi(
        shopDomain,
        token,
        `/customers/${customerId}/addresses/${input.deleteAddressId}.json`,
        { method: 'DELETE' }
      )
      return { success: true }
    }

    case 'setDefault': {
      const result = await shopifyApi<{ customer_address: any }>(
        shopDomain,
        token,
        `/customers/${customerId}/addresses/${input.setDefaultAddressId}/default.json`,
        { method: 'PUT' }
      )
      return { address: mapAddressResponse(result.customer_address) }
    }

    default:
      throw new Error(`Unknown customer address operation: ${operation}`)
  }
}

function mapAddressResponse(address: any) {
  return {
    addressId: String(address.id ?? ''),
    address1: address.address1 || '',
    address2: address.address2 || '',
    city: address.city || '',
    province: address.province || '',
    country: address.country || '',
    zip: address.zip || '',
    phone: address.phone || '',
    company: address.company || '',
    firstName: address.first_name || '',
    lastName: address.last_name || '',
    isDefault: address.default ?? false,
  }
}
