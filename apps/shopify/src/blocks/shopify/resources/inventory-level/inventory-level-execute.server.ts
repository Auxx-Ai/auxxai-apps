// src/blocks/shopify/resources/inventory-level/inventory-level-execute.server.ts

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

export async function executeInventoryLevel(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyInventoryItemIds) qs.inventory_item_ids = input.getManyInventoryItemIds
      if (input.getManyLocationIds) qs.location_ids = input.getManyLocationIds

      const result = await shopifyApi<{ inventory_levels: any[] }>(
        shopDomain,
        token,
        '/inventory_levels.json',
        { qs }
      )
      const levels = (result.inventory_levels || []).map(mapInventoryLevelResponse)
      return {
        inventoryLevels: levels,
        count: levels.length,
      }
    }

    case 'set': {
      const result = await shopifyApi<{ inventory_level: any }>(
        shopDomain,
        token,
        '/inventory_levels/set.json',
        {
          method: 'POST',
          body: {
            inventory_item_id: Number(input.setInventoryItemId),
            location_id: Number(input.setLocationId),
            available: input.setAvailable,
            disconnect_if_necessary: !!input.setDisconnectIfNecessary,
          },
        }
      )
      return { inventoryLevel: mapInventoryLevelResponse(result.inventory_level) }
    }

    case 'adjust': {
      const result = await shopifyApi<{ inventory_level: any }>(
        shopDomain,
        token,
        '/inventory_levels/adjust.json',
        {
          method: 'POST',
          body: {
            inventory_item_id: Number(input.adjustInventoryItemId),
            location_id: Number(input.adjustLocationId),
            available_adjustment: input.adjustAvailableAdjustment,
          },
        }
      )
      return { inventoryLevel: mapInventoryLevelResponse(result.inventory_level) }
    }

    case 'connect': {
      const result = await shopifyApi<{ inventory_level: any }>(
        shopDomain,
        token,
        '/inventory_levels/connect.json',
        {
          method: 'POST',
          body: {
            inventory_item_id: Number(input.connectInventoryItemId),
            location_id: Number(input.connectLocationId),
          },
        }
      )
      return { inventoryLevel: mapInventoryLevelResponse(result.inventory_level) }
    }

    case 'delete': {
      const qs: Record<string, string> = {
        inventory_item_id: input.deleteInventoryItemId,
        location_id: input.deleteLocationId,
      }

      await shopifyApi(shopDomain, token, '/inventory_levels.json', {
        method: 'DELETE',
        qs,
      })
      return { success: true }
    }

    default:
      throw new Error(`Unknown inventory level operation: ${operation}`)
  }
}

function mapInventoryLevelResponse(level: any) {
  return {
    inventoryItemId: String(level.inventory_item_id ?? ''),
    locationId: String(level.location_id ?? ''),
    available: level.available ?? 0,
    updatedAt: level.updated_at || '',
  }
}
