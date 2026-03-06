// src/blocks/shopify/resources/variant/variant-execute.server.ts

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

export async function executeVariant(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const variant: any = {}
      if (input.createTitle) variant.title = input.createTitle
      if (input.createPrice) variant.price = input.createPrice
      if (input.createCompareAtPrice) variant.compare_at_price = input.createCompareAtPrice
      if (input.createSku) variant.sku = input.createSku
      if (input.createBarcode) variant.barcode = input.createBarcode
      if (input.createWeight) variant.weight = Number(input.createWeight)
      if (input.createWeightUnit) variant.weight_unit = input.createWeightUnit
      if (input.createInventoryQuantity)
        variant.inventory_quantity = Number(input.createInventoryQuantity)
      if (input.createInventoryPolicy) variant.inventory_policy = input.createInventoryPolicy
      if (input.createFulfillmentService)
        variant.fulfillment_service = input.createFulfillmentService
      if (input.createRequiresShipping)
        variant.requires_shipping = input.createRequiresShipping === 'true'
      if (input.createTaxable) variant.taxable = input.createTaxable === 'true'
      if (input.createOption1) variant.option1 = input.createOption1
      if (input.createOption2) variant.option2 = input.createOption2
      if (input.createOption3) variant.option3 = input.createOption3

      const result = await shopifyApi<{ variant: any }>(
        shopDomain,
        token,
        `/products/${input.productId}/variants.json`,
        { method: 'POST', body: { variant } }
      )
      return mapVariantResponse(result.variant)
    }

    case 'update': {
      const variant: any = {}
      if (input.updateTitle) variant.title = input.updateTitle
      if (input.updatePrice) variant.price = input.updatePrice
      if (input.updateCompareAtPrice) variant.compare_at_price = input.updateCompareAtPrice
      if (input.updateSku) variant.sku = input.updateSku
      if (input.updateBarcode) variant.barcode = input.updateBarcode
      if (input.updateWeight) variant.weight = Number(input.updateWeight)
      if (input.updateWeightUnit) variant.weight_unit = input.updateWeightUnit
      if (input.updateInventoryPolicy) variant.inventory_policy = input.updateInventoryPolicy
      if (input.updateTaxable === 'true') variant.taxable = true
      else if (input.updateTaxable === 'false') variant.taxable = false
      if (input.updateOption1) variant.option1 = input.updateOption1
      if (input.updateOption2) variant.option2 = input.updateOption2
      if (input.updateOption3) variant.option3 = input.updateOption3

      const result = await shopifyApi<{ variant: any }>(
        shopDomain,
        token,
        `/variants/${input.updateVariantId}.json`,
        { method: 'PUT', body: { variant } }
      )
      return mapVariantResponse(result.variant)
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields) qs.fields = input.getFields

      const result = await shopifyApi<{ variant: any }>(
        shopDomain,
        token,
        `/variants/${input.getVariantId}.json`,
        { qs }
      )
      return mapVariantResponse(result.variant)
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyFields) qs.fields = input.getManyFields

      const result = await shopifyApi<{ variants: any[] }>(
        shopDomain,
        token,
        `/products/${input.productId}/variants.json`,
        { qs }
      )
      const variants = result.variants || []
      return {
        variants,
        count: String(variants.length),
      }
    }

    case 'delete': {
      await shopifyApi(
        shopDomain,
        token,
        `/products/${input.productId}/variants/${input.deleteVariantId}.json`,
        { method: 'DELETE' }
      )
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown variant operation: ${operation}`)
  }
}

function mapVariantResponse(variant: any) {
  return {
    variantId: String(variant.id ?? ''),
    title: variant.title || '',
    price: variant.price || '',
    compareAtPrice: variant.compare_at_price || '',
    sku: variant.sku || '',
    barcode: variant.barcode || '',
    weight: String(variant.weight ?? ''),
    weightUnit: variant.weight_unit || '',
    inventoryItemId: String(variant.inventory_item_id ?? ''),
    inventoryQuantity: String(variant.inventory_quantity ?? '0'),
    option1: variant.option1 || '',
    option2: variant.option2 || '',
    option3: variant.option3 || '',
    createdAt: variant.created_at || '',
    updatedAt: variant.updated_at || '',
  }
}
