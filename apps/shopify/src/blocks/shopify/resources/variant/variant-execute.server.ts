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

function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2)
}

function decimalToCents(decimal: string | number): number {
  return Math.round(parseFloat(String(decimal)) * 100)
}

export async function executeVariant(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const variant: any = {}
      if (input.createTitle) variant.title = input.createTitle
      if (input.createPrice != null) variant.price = centsToDecimal(input.createPrice)
      if (input.createCompareAtPrice != null)
        variant.compare_at_price = centsToDecimal(input.createCompareAtPrice)
      if (input.createSku) variant.sku = input.createSku
      if (input.createBarcode) variant.barcode = input.createBarcode
      if (input.createWeight != null) variant.weight = input.createWeight
      if (input.createWeightUnit) variant.weight_unit = input.createWeightUnit
      if (input.createInventoryQuantity != null)
        variant.inventory_quantity = input.createInventoryQuantity
      if (input.createInventoryPolicy) variant.inventory_policy = input.createInventoryPolicy
      if (input.createFulfillmentService)
        variant.fulfillment_service = input.createFulfillmentService
      if (input.createRequiresShipping != null)
        variant.requires_shipping = input.createRequiresShipping
      if (input.createTaxable != null) variant.taxable = input.createTaxable
      if (input.createOption1) variant.option1 = input.createOption1
      if (input.createOption2) variant.option2 = input.createOption2
      if (input.createOption3) variant.option3 = input.createOption3

      const result = await shopifyApi<{ variant: any }>(
        shopDomain,
        token,
        `/products/${input.productId}/variants.json`,
        { method: 'POST', body: { variant } }
      )
      return { variant: mapVariantResponse(result.variant) }
    }

    case 'update': {
      const variant: any = {}
      if (input.updateTitle) variant.title = input.updateTitle
      if (input.updatePrice != null) variant.price = centsToDecimal(input.updatePrice)
      if (input.updateCompareAtPrice != null)
        variant.compare_at_price = centsToDecimal(input.updateCompareAtPrice)
      if (input.updateSku) variant.sku = input.updateSku
      if (input.updateBarcode) variant.barcode = input.updateBarcode
      if (input.updateWeight != null) variant.weight = input.updateWeight
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
      return { variant: mapVariantResponse(result.variant) }
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields?.length) qs.fields = input.getFields.join(',')

      const result = await shopifyApi<{ variant: any }>(
        shopDomain,
        token,
        `/variants/${input.getVariantId}.json`,
        { qs }
      )
      return { variant: mapVariantResponse(result.variant) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyFields?.length) qs.fields = input.getManyFields.join(',')

      const result = await shopifyApi<{ variants: any[] }>(
        shopDomain,
        token,
        `/products/${input.productId}/variants.json`,
        { qs }
      )
      const variants = (result.variants || []).map(mapVariantResponse)
      return {
        variants,
        count: variants.length,
      }
    }

    case 'delete': {
      await shopifyApi(
        shopDomain,
        token,
        `/products/${input.productId}/variants/${input.deleteVariantId}.json`,
        { method: 'DELETE' }
      )
      return { success: true }
    }

    default:
      throw new Error(`Unknown variant operation: ${operation}`)
  }
}

function mapVariantResponse(variant: any) {
  return {
    variantId: String(variant.id ?? ''),
    title: variant.title || '',
    price: decimalToCents(variant.price || '0'),
    compareAtPrice: decimalToCents(variant.compare_at_price || '0'),
    sku: variant.sku || '',
    barcode: variant.barcode || '',
    weight: variant.weight ?? 0,
    weightUnit: variant.weight_unit || '',
    inventoryItemId: String(variant.inventory_item_id ?? ''),
    inventoryQuantity: variant.inventory_quantity ?? 0,
    option1: variant.option1 || '',
    option2: variant.option2 || '',
    option3: variant.option3 || '',
    createdAt: variant.created_at || '',
    updatedAt: variant.updated_at || '',
  }
}
