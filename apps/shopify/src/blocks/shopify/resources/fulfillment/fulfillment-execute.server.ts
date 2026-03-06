// src/blocks/shopify/resources/fulfillment/fulfillment-execute.server.ts

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

export async function executeFulfillment(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()
  const orderId = input.orderId

  switch (operation) {
    case 'create': {
      const fulfillment: any = {}
      if (input.createLocationId) fulfillment.location_id = Number(input.createLocationId)
      if (input.createTrackingNumber) fulfillment.tracking_number = input.createTrackingNumber
      if (input.createTrackingCompany) fulfillment.tracking_company = input.createTrackingCompany
      if (input.createTrackingUrl) fulfillment.tracking_urls = [input.createTrackingUrl]
      fulfillment.notify_customer = input.createNotifyCustomer === 'true'

      if (input.createLineItems?.length) {
        fulfillment.line_items = input.createLineItems.map((li: any) => ({
          id: Number(li.id),
          quantity: Number(li.quantity),
        }))
      }

      const result = await shopifyApi<{ fulfillment: any }>(
        shopDomain,
        token,
        `/orders/${orderId}/fulfillments.json`,
        { method: 'POST', body: { fulfillment } }
      )
      return mapFulfillmentResponse(result.fulfillment)
    }

    case 'update': {
      const fulfillment: any = {}
      if (input.updateTrackingNumber) fulfillment.tracking_number = input.updateTrackingNumber
      if (input.updateTrackingCompany) fulfillment.tracking_company = input.updateTrackingCompany
      if (input.updateTrackingUrl) fulfillment.tracking_urls = [input.updateTrackingUrl]
      fulfillment.notify_customer = input.updateNotifyCustomer === 'true'

      const result = await shopifyApi<{ fulfillment: any }>(
        shopDomain,
        token,
        `/orders/${orderId}/fulfillments/${input.updateFulfillmentId}.json`,
        { method: 'PUT', body: { fulfillment } }
      )
      return mapFulfillmentResponse(result.fulfillment)
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields) qs.fields = input.getFields

      const result = await shopifyApi<{ fulfillment: any }>(
        shopDomain,
        token,
        `/orders/${orderId}/fulfillments/${input.getFulfillmentId}.json`,
        { qs }
      )
      return mapFulfillmentResponse(result.fulfillment)
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyCreatedAtMin) qs.created_at_min = input.getManyCreatedAtMin
      if (input.getManyCreatedAtMax) qs.created_at_max = input.getManyCreatedAtMax
      if (input.getManyFields) qs.fields = input.getManyFields

      const result = await shopifyApi<{ fulfillments: any[] }>(
        shopDomain,
        token,
        `/orders/${orderId}/fulfillments.json`,
        { qs }
      )
      const fulfillments = result.fulfillments || []
      return {
        fulfillments,
        count: String(fulfillments.length),
      }
    }

    case 'cancel': {
      const result = await shopifyApi<{ fulfillment: any }>(
        shopDomain,
        token,
        `/orders/${orderId}/fulfillments/${input.cancelFulfillmentId}/cancel.json`,
        { method: 'POST' }
      )
      return mapFulfillmentResponse(result.fulfillment)
    }

    default:
      throw new Error(`Unknown fulfillment operation: ${operation}`)
  }
}

function mapFulfillmentResponse(fulfillment: any) {
  return {
    fulfillmentId: String(fulfillment.id ?? ''),
    orderId: String(fulfillment.order_id ?? ''),
    status: fulfillment.status || '',
    trackingNumber: fulfillment.tracking_number || '',
    trackingCompany: fulfillment.tracking_company || '',
    trackingUrl: (fulfillment.tracking_urls || [])[0] || fulfillment.tracking_url || '',
    lineItems: fulfillment.line_items || [],
    createdAt: fulfillment.created_at || '',
    updatedAt: fulfillment.updated_at || '',
  }
}
