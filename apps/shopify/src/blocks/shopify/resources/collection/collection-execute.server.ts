// src/blocks/shopify/resources/collection/collection-execute.server.ts

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

export async function executeCollection(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const collection: any = {
        title: input.createTitle,
      }
      if (input.createBodyHtml) collection.body_html = input.createBodyHtml
      if (input.createPublished === 'false') collection.published = false
      if (input.createSortOrder) collection.sort_order = input.createSortOrder
      if (input.createTemplateSuffix) collection.template_suffix = input.createTemplateSuffix
      if (input.createImageUrl) collection.image = { src: input.createImageUrl }

      const result = await shopifyApi<{ custom_collection: any }>(
        shopDomain,
        token,
        '/custom_collections.json',
        { method: 'POST', body: { custom_collection: collection } }
      )
      return mapCollectionResponse(result.custom_collection)
    }

    case 'update': {
      const collection: any = {}
      if (input.updateTitle) collection.title = input.updateTitle
      if (input.updateBodyHtml) collection.body_html = input.updateBodyHtml
      if (input.updatePublished === 'true') collection.published = true
      else if (input.updatePublished === 'false') collection.published = false
      if (input.updateSortOrder) collection.sort_order = input.updateSortOrder

      const result = await shopifyApi<{ custom_collection: any }>(
        shopDomain,
        token,
        `/custom_collections/${input.updateCollectionId}.json`,
        { method: 'PUT', body: { custom_collection: collection } }
      )
      return mapCollectionResponse(result.custom_collection)
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields) qs.fields = input.getFields

      // Try custom collection first, fall back to smart collection
      try {
        const result = await shopifyApi<{ custom_collection: any }>(
          shopDomain,
          token,
          `/custom_collections/${input.getCollectionId}.json`,
          { qs }
        )
        return mapCollectionResponse(result.custom_collection)
      } catch {
        const result = await shopifyApi<{ smart_collection: any }>(
          shopDomain,
          token,
          `/smart_collections/${input.getCollectionId}.json`,
          { qs }
        )
        return mapCollectionResponse(result.smart_collection)
      }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyProductId) qs.product_id = input.getManyProductId
      if (input.getManyTitle) qs.title = input.getManyTitle
      if (input.getManyFields) qs.fields = input.getManyFields

      const endpoint =
        input.getManyType === 'smart' ? '/smart_collections.json' : '/custom_collections.json'
      const key = input.getManyType === 'smart' ? 'smart_collections' : 'custom_collections'

      const result = await shopifyApi<Record<string, any[]>>(shopDomain, token, endpoint, { qs })
      const collections = result[key] || []
      return {
        collections,
        count: String(collections.length),
      }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/custom_collections/${input.deleteCollectionId}.json`, {
        method: 'DELETE',
      })
      return { success: 'true' }
    }

    case 'addProduct': {
      const result = await shopifyApi<{ collect: any }>(shopDomain, token, '/collects.json', {
        method: 'POST',
        body: {
          collect: {
            collection_id: Number(input.addProductCollectionId),
            product_id: Number(input.addProductProductId),
          },
        },
      })
      return {
        collectId: String(result.collect.id ?? ''),
        collectionId: String(result.collect.collection_id ?? ''),
        productId: String(result.collect.product_id ?? ''),
      }
    }

    case 'removeProduct': {
      await shopifyApi(shopDomain, token, `/collects/${input.removeProductCollectId}.json`, {
        method: 'DELETE',
      })
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown collection operation: ${operation}`)
  }
}

function mapCollectionResponse(collection: any) {
  return {
    collectionId: String(collection.id ?? ''),
    title: collection.title || '',
    bodyHtml: collection.body_html || '',
    handle: collection.handle || '',
    sortOrder: collection.sort_order || '',
    publishedAt: collection.published_at || '',
    updatedAt: collection.updated_at || '',
  }
}
