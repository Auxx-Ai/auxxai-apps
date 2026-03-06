// src/blocks/shopify/resources/inventory-item/inventory-item-execute.server.ts

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

export async function executeInventoryItem(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'get': {
      const result = await shopifyApi<{ inventory_item: any }>(
        shopDomain,
        token,
        `/inventory_items/${input.getInventoryItemId}.json`
      )
      return mapInventoryItemResponse(result.inventory_item)
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyIds) qs.ids = input.getManyIds

      const result = await shopifyApi<{ inventory_items: any[] }>(
        shopDomain,
        token,
        '/inventory_items.json',
        { qs }
      )
      const items = result.inventory_items || []
      return {
        inventoryItems: items,
        count: String(items.length),
      }
    }

    case 'update': {
      const inventoryItem: any = {}
      if (input.updateCost) inventoryItem.cost = input.updateCost
      if (input.updateTracked === 'true') inventoryItem.tracked = true
      else if (input.updateTracked === 'false') inventoryItem.tracked = false
      if (input.updateCountryCodeOfOrigin)
        inventoryItem.country_code_of_origin = input.updateCountryCodeOfOrigin
      if (input.updateHarmonizedSystemCode)
        inventoryItem.harmonized_system_code = input.updateHarmonizedSystemCode

      const result = await shopifyApi<{ inventory_item: any }>(
        shopDomain,
        token,
        `/inventory_items/${input.updateInventoryItemId}.json`,
        { method: 'PUT', body: { inventory_item: inventoryItem } }
      )
      return mapInventoryItemResponse(result.inventory_item)
    }

    default:
      throw new Error(`Unknown inventory item operation: ${operation}`)
  }
}

function mapInventoryItemResponse(item: any) {
  return {
    inventoryItemId: String(item.id ?? ''),
    sku: item.sku || '',
    cost: item.cost || '',
    tracked: String(item.tracked ?? false),
    countryCodeOfOrigin: item.country_code_of_origin || '',
    harmonizedSystemCode: item.harmonized_system_code || '',
    createdAt: item.created_at || '',
    updatedAt: item.updated_at || '',
  }
}
