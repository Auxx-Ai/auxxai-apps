// src/blocks/shopify/resources/metafield/metafield-execute.server.ts

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

const OWNER_RESOURCE_PATHS: Record<string, string> = {
  shop: '',
  product: 'products',
  variant: 'variants',
  customer: 'customers',
  order: 'orders',
  draft_order: 'draft_orders',
  collection: 'custom_collections',
}

function getOwnerPath(ownerResource: string, ownerId: string): string {
  if (ownerResource === 'shop' || !ownerResource) return ''
  const segment = OWNER_RESOURCE_PATHS[ownerResource] || `${ownerResource}s`
  return `/${segment}/${ownerId}`
}

export async function executeMetafield(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()
  const ownerResource = input.ownerResource || 'product'
  const ownerId = input.ownerId || ''

  switch (operation) {
    case 'create': {
      const metafield: any = {
        namespace: input.createNamespace,
        key: input.createKey,
        value: input.createValue,
        type: input.createType || 'single_line_text_field',
      }

      const ownerPath = getOwnerPath(ownerResource, ownerId)
      const result = await shopifyApi<{ metafield: any }>(
        shopDomain,
        token,
        `${ownerPath}/metafields.json`,
        { method: 'POST', body: { metafield } }
      )
      return { metafield: mapMetafieldResponse(result.metafield) }
    }

    case 'update': {
      const metafield: any = {}
      if (input.updateValue) metafield.value = input.updateValue
      if (input.updateType) metafield.type = input.updateType

      const result = await shopifyApi<{ metafield: any }>(
        shopDomain,
        token,
        `/metafields/${input.updateMetafieldId}.json`,
        { method: 'PUT', body: { metafield } }
      )
      return { metafield: mapMetafieldResponse(result.metafield) }
    }

    case 'get': {
      const result = await shopifyApi<{ metafield: any }>(
        shopDomain,
        token,
        `/metafields/${input.getMetafieldId}.json`
      )
      return { metafield: mapMetafieldResponse(result.metafield) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyNamespace) qs.namespace = input.getManyNamespace
      if (input.getManyKey) qs.key = input.getManyKey

      const ownerPath = getOwnerPath(ownerResource, ownerId)
      const result = await shopifyApi<{ metafields: any[] }>(
        shopDomain,
        token,
        `${ownerPath}/metafields.json`,
        { qs }
      )
      const metafields = (result.metafields || []).map(mapMetafieldResponse)
      return {
        metafields,
        count: metafields.length,
      }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/metafields/${input.deleteMetafieldId}.json`, {
        method: 'DELETE',
      })
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown metafield operation: ${operation}`)
  }
}

function mapMetafieldResponse(metafield: any) {
  return {
    metafieldId: String(metafield.id ?? ''),
    namespace: metafield.namespace || '',
    key: metafield.key || '',
    value: metafield.value || '',
    type: metafield.type || '',
    ownerResource: metafield.owner_resource || '',
    ownerId: String(metafield.owner_id ?? ''),
    createdAt: metafield.created_at || '',
    updatedAt: metafield.updated_at || '',
  }
}
