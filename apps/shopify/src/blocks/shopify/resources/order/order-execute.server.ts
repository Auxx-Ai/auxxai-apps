// src/blocks/shopify/resources/order/order-execute.server.ts

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

export async function executeOrder(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const lineItems = (input.createLineItems || []).map((item: any) => {
        const li: any = {}
        if (item.productId) li.product_id = Number(item.productId)
        if (item.variantId) li.variant_id = Number(item.variantId)
        if (item.title) li.title = item.title
        if (item.quantity) li.quantity = item.quantity
        if (item.price != null) li.price = centsToDecimal(item.price)
        return li
      })

      const order: any = { line_items: lineItems }

      if (input.createEmail) order.email = input.createEmail
      if (input.createFulfillmentStatus) order.fulfillment_status = input.createFulfillmentStatus
      if (input.createNote) order.note = input.createNote
      if (input.createTags) order.tags = input.createTags
      if (input.createSendReceipt) order.send_receipt = true
      if (input.createSendFulfillmentReceipt) order.send_fulfillment_receipt = true
      if (input.createInventoryBehaviour) order.inventory_behaviour = input.createInventoryBehaviour
      if (input.createLocationId) order.location_id = Number(input.createLocationId)
      if (input.createSourceName) order.source_name = input.createSourceName
      if (input.createTest) order.test = true

      const shipping = buildAddress(input, 'createShipping')
      if (Object.keys(shipping).length > 0) order.shipping_address = shipping

      const billing = buildAddress(input, 'createBilling')
      if (Object.keys(billing).length > 0) order.billing_address = billing

      if (input.createDiscountCodes?.length) {
        order.discount_codes = input.createDiscountCodes.map((dc: any) => ({
          code: dc.code,
          amount: dc.amount != null ? centsToDecimal(dc.amount) : undefined,
          type: dc.type,
        }))
      }

      const result = await shopifyApi<{ order: any }>(shopDomain, token, '/orders.json', {
        method: 'POST',
        body: { order },
      })
      return { order: mapOrderResponse(result.order) }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/orders/${input.deleteOrderId}.json`, {
        method: 'DELETE',
      })
      return { success: true }
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields?.length) qs.fields = input.getFields.join(',')

      const result = await shopifyApi<{ order: any }>(
        shopDomain,
        token,
        `/orders/${input.getOrderId}.json`,
        { qs }
      )
      return { order: mapOrderResponse(result.order) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyStatus !== 'any') qs.status = input.getManyStatus
      if (input.getManyFinancialStatus !== 'any') qs.financial_status = input.getManyFinancialStatus
      if (input.getManyFulfillmentStatus !== 'any')
        qs.fulfillment_status = input.getManyFulfillmentStatus
      if (input.getManyCreatedAtMin) qs.created_at_min = input.getManyCreatedAtMin
      if (input.getManyCreatedAtMax) qs.created_at_max = input.getManyCreatedAtMax
      if (input.getManyUpdatedAtMin) qs.updated_at_min = input.getManyUpdatedAtMin
      if (input.getManyUpdatedAtMax) qs.updated_at_max = input.getManyUpdatedAtMax
      if (input.getManyFields?.length) qs.fields = input.getManyFields.join(',')

      const result = await shopifyApi<{ orders: any[] }>(shopDomain, token, '/orders.json', { qs })
      const orders = (result.orders || []).map(mapOrderResponse)
      return {
        orders,
        count: orders.length,
      }
    }

    case 'update': {
      const order: any = {}

      if (input.updateEmail) order.email = input.updateEmail
      if (input.updateNote) order.note = input.updateNote
      if (input.updateTags) order.tags = input.updateTags
      if (input.updateSourceName) order.source_name = input.updateSourceName
      if (input.updateLocationId) order.location_id = Number(input.updateLocationId)

      const shipping = buildAddress(input, 'updateShipping')
      if (Object.keys(shipping).length > 0) order.shipping_address = shipping

      const result = await shopifyApi<{ order: any }>(
        shopDomain,
        token,
        `/orders/${input.updateOrderId}.json`,
        { method: 'PUT', body: { order } }
      )
      return { order: mapOrderResponse(result.order) }
    }

    default:
      throw new Error(`Unknown order operation: ${operation}`)
  }
}

function buildAddress(input: any, prefix: string) {
  const addr: any = {}
  if (input[`${prefix}FirstName`]) addr.first_name = input[`${prefix}FirstName`]
  if (input[`${prefix}LastName`]) addr.last_name = input[`${prefix}LastName`]
  if (input[`${prefix}Address1`]) addr.address1 = input[`${prefix}Address1`]
  if (input[`${prefix}Address2`]) addr.address2 = input[`${prefix}Address2`]
  if (input[`${prefix}City`]) addr.city = input[`${prefix}City`]
  if (input[`${prefix}Province`]) addr.province = input[`${prefix}Province`]
  if (input[`${prefix}Country`]) addr.country = input[`${prefix}Country`]
  if (input[`${prefix}Zip`]) addr.zip = input[`${prefix}Zip`]
  if (input[`${prefix}Phone`]) addr.phone = input[`${prefix}Phone`]
  return addr
}

function mapOrderResponse(order: any) {
  return {
    orderId: String(order.id ?? ''),
    orderNumber: String(order.order_number ?? ''),
    name: order.name || '',
    email: order.email || '',
    totalPrice: decimalToCents(order.total_price || '0'),
    subtotalPrice: decimalToCents(order.subtotal_price || '0'),
    currency: order.currency || '',
    financialStatus: order.financial_status || '',
    fulfillmentStatus: order.fulfillment_status || '',
    tags: order.tags || '',
    note: order.note || '',
    lineItems: order.line_items || [],
    customer: order.customer || {},
    createdAt: order.created_at || '',
    updatedAt: order.updated_at || '',
    orderStatusUrl: order.order_status_url || '',
  }
}
