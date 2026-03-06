// src/blocks/shopify/resources/product/product-execute.server.ts

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

export async function executeProduct(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const product: any = {
        title: input.createTitle,
      }

      if (input.createBodyHtml) product.body_html = input.createBodyHtml
      if (input.createVendor) product.vendor = input.createVendor
      if (input.createProductType) product.product_type = input.createProductType
      if (input.createTags) product.tags = input.createTags
      if (input.createHandle) product.handle = input.createHandle
      if (input.createPublished === false) product.published_at = null
      if (input.createPublishedScope) product.published_scope = input.createPublishedScope
      if (input.createTemplateSuffix) product.template_suffix = input.createTemplateSuffix
      if (input.createImages?.length) {
        product.images = input.createImages.map((img: any) => {
          const image: any = { src: img.src }
          if (img.position != null) image.position = img.position
          return image
        })
      }
      if (input.createOptions) {
        product.options = input.createOptions.split(',').map((o: string, i: number) => ({
          name: o.trim(),
          position: i + 1,
        }))
      }

      const result = await shopifyApi<{ product: any }>(shopDomain, token, '/products.json', {
        method: 'POST',
        body: { product },
      })
      return { product: mapProductResponse(result.product) }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/products/${input.deleteProductId}.json`, {
        method: 'DELETE',
      })
      return { success: true }
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getProductFields?.length) qs.fields = input.getProductFields.join(',')

      const result = await shopifyApi<{ product: any }>(
        shopDomain,
        token,
        `/products/${input.getProductId}.json`,
        { qs }
      )
      return { product: mapProductResponse(result.product) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getProductManyLimit || '50',
      }
      if (input.getProductManyTitle) qs.title = input.getProductManyTitle
      if (input.getProductManyVendor) qs.vendor = input.getProductManyVendor
      if (input.getProductManyProductType) qs.product_type = input.getProductManyProductType
      if (input.getProductManyHandle) qs.handle = input.getProductManyHandle
      if (input.getProductManyCollectionId) qs.collection_id = input.getProductManyCollectionId
      if (input.getProductManyPublishedStatus !== 'any')
        qs.published_status = input.getProductManyPublishedStatus
      if (input.getProductManyCreatedAtMin) qs.created_at_min = input.getProductManyCreatedAtMin
      if (input.getProductManyCreatedAtMax) qs.created_at_max = input.getProductManyCreatedAtMax
      if (input.getProductManyUpdatedAtMin) qs.updated_at_min = input.getProductManyUpdatedAtMin
      if (input.getProductManyUpdatedAtMax) qs.updated_at_max = input.getProductManyUpdatedAtMax
      if (input.getProductManyFields?.length) qs.fields = input.getProductManyFields.join(',')

      const result = await shopifyApi<{ products: any[] }>(shopDomain, token, '/products.json', {
        qs,
      })
      const products = (result.products || []).map(mapProductResponse)
      return {
        products,
        count: products.length,
      }
    }

    case 'update': {
      const product: any = {}

      if (input.updateTitle) product.title = input.updateTitle
      if (input.updateBodyHtml) product.body_html = input.updateBodyHtml
      if (input.updateVendor) product.vendor = input.updateVendor
      if (input.updateProductType) product.product_type = input.updateProductType
      if (input.updateTags) product.tags = input.updateTags
      if (input.updateHandle) product.handle = input.updateHandle
      if (input.updatePublished === 'true') product.published_at = new Date().toISOString()
      else if (input.updatePublished === 'false') product.published_at = null
      if (input.updatePublishedScope) product.published_scope = input.updatePublishedScope
      if (input.updateTemplateSuffix) product.template_suffix = input.updateTemplateSuffix
      if (input.updateImages?.length) {
        product.images = input.updateImages.map((img: any) => {
          const image: any = { src: img.src }
          if (img.position != null) image.position = img.position
          return image
        })
      }
      if (input.updateOptions) {
        product.options = input.updateOptions.split(',').map((o: string, i: number) => ({
          name: o.trim(),
          position: i + 1,
        }))
      }

      const result = await shopifyApi<{ product: any }>(
        shopDomain,
        token,
        `/products/${input.updateProductId}.json`,
        { method: 'PUT', body: { product } }
      )
      return { product: mapProductResponse(result.product) }
    }

    default:
      throw new Error(`Unknown product operation: ${operation}`)
  }
}

function mapProductResponse(product: any) {
  return {
    productId: String(product.id ?? ''),
    title: product.title || '',
    bodyHtml: product.body_html || '',
    vendor: product.vendor || '',
    productType: product.product_type || '',
    handle: product.handle || '',
    tags: product.tags || '',
    status: product.status || '',
    variants: product.variants || [],
    images: product.images || [],
    createdAt: product.created_at || '',
    updatedAt: product.updated_at || '',
  }
}
