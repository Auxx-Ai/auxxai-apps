// src/blocks/shopify/resources/draft-order/draft-order-execute.server.ts

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

export async function executeDraftOrder(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      const draftOrder: any = {}

      if (input.createLineItems?.length) {
        draftOrder.line_items = input.createLineItems.map((li: any) => {
          const item: any = {}
          if (li.variantId) item.variant_id = Number(li.variantId)
          if (li.title) item.title = li.title
          if (li.quantity) item.quantity = li.quantity
          if (li.price != null) item.price = centsToDecimal(li.price)
          return item
        })
      }

      if (input.createCustomerId) draftOrder.customer = { id: Number(input.createCustomerId) }
      if (input.createEmail) draftOrder.email = input.createEmail
      if (input.createNote) draftOrder.note = input.createNote
      if (input.createTags) draftOrder.tags = input.createTags
      if (input.createTaxExempt) draftOrder.tax_exempt = true
      if (input.createUseCustomerDefaultAddress) {
        draftOrder.use_customer_default_address = true
      }

      if (!input.createUseCustomerDefaultAddress) {
        const shipping: any = {}
        if (input.createShippingFirstName) shipping.first_name = input.createShippingFirstName
        if (input.createShippingLastName) shipping.last_name = input.createShippingLastName
        if (input.createShippingAddress1) shipping.address1 = input.createShippingAddress1
        if (input.createShippingAddress2) shipping.address2 = input.createShippingAddress2
        if (input.createShippingCity) shipping.city = input.createShippingCity
        if (input.createShippingProvince) shipping.province = input.createShippingProvince
        if (input.createShippingCountry) shipping.country = input.createShippingCountry
        if (input.createShippingZip) shipping.zip = input.createShippingZip
        if (input.createShippingPhone) shipping.phone = input.createShippingPhone
        if (Object.keys(shipping).length > 0) draftOrder.shipping_address = shipping
      }

      const result = await shopifyApi<{ draft_order: any }>(
        shopDomain,
        token,
        '/draft_orders.json',
        { method: 'POST', body: { draft_order: draftOrder } }
      )
      return { draftOrder: mapDraftOrderResponse(result.draft_order) }
    }

    case 'update': {
      const draftOrder: any = {}
      if (input.updateNote) draftOrder.note = input.updateNote
      if (input.updateTags) draftOrder.tags = input.updateTags
      if (input.updateEmail) draftOrder.email = input.updateEmail

      const result = await shopifyApi<{ draft_order: any }>(
        shopDomain,
        token,
        `/draft_orders/${input.updateDraftOrderId}.json`,
        { method: 'PUT', body: { draft_order: draftOrder } }
      )
      return { draftOrder: mapDraftOrderResponse(result.draft_order) }
    }

    case 'get': {
      const qs: Record<string, string> = {}
      if (input.getFields?.length) qs.fields = input.getFields.join(',')

      const result = await shopifyApi<{ draft_order: any }>(
        shopDomain,
        token,
        `/draft_orders/${input.getDraftOrderId}.json`,
        { qs }
      )
      return { draftOrder: mapDraftOrderResponse(result.draft_order) }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }
      if (input.getManyStatus) qs.status = input.getManyStatus
      if (input.getManyFields?.length) qs.fields = input.getManyFields.join(',')

      const result = await shopifyApi<{ draft_orders: any[] }>(
        shopDomain,
        token,
        '/draft_orders.json',
        { qs }
      )
      const draftOrders = (result.draft_orders || []).map(mapDraftOrderResponse)
      return {
        draftOrders,
        count: draftOrders.length,
      }
    }

    case 'delete': {
      await shopifyApi(shopDomain, token, `/draft_orders/${input.deleteDraftOrderId}.json`, {
        method: 'DELETE',
      })
      return { success: true }
    }

    case 'complete': {
      const qs: Record<string, string> = {}
      if (input.completePaymentPending) qs.payment_pending = 'true'

      const result = await shopifyApi<{ draft_order: any }>(
        shopDomain,
        token,
        `/draft_orders/${input.completeDraftOrderId}/complete.json`,
        { method: 'PUT', qs }
      )
      return { draftOrder: mapDraftOrderResponse(result.draft_order) }
    }

    case 'sendInvoice': {
      const invoice: any = {}
      if (input.sendInvoiceTo) invoice.to = input.sendInvoiceTo
      if (input.sendInvoiceSubject) invoice.subject = input.sendInvoiceSubject
      if (input.sendInvoiceCustomMessage) invoice.custom_message = input.sendInvoiceCustomMessage
      if (input.sendInvoiceBcc) {
        invoice.bcc = input.sendInvoiceBcc.split(',').map((e: string) => e.trim())
      }

      const result = await shopifyApi<{ draft_order_invoice: any }>(
        shopDomain,
        token,
        `/draft_orders/${input.sendInvoiceDraftOrderId}/send_invoice.json`,
        { method: 'POST', body: { draft_order_invoice: invoice } }
      )
      return {
        draftOrderInvoice: result.draft_order_invoice || {},
      }
    }

    default:
      throw new Error(`Unknown draft order operation: ${operation}`)
  }
}

function mapDraftOrderResponse(draftOrder: any) {
  return {
    draftOrderId: String(draftOrder.id ?? ''),
    name: draftOrder.name || '',
    status: draftOrder.status || '',
    email: draftOrder.email || '',
    totalPrice: decimalToCents(draftOrder.total_price || '0'),
    subtotalPrice: decimalToCents(draftOrder.subtotal_price || '0'),
    currency: draftOrder.currency || '',
    tags: draftOrder.tags || '',
    note: draftOrder.note || '',
    lineItems: draftOrder.line_items || [],
    customer: draftOrder.customer || {},
    orderId: String(draftOrder.order_id ?? ''),
    invoiceUrl: draftOrder.invoice_url || '',
    createdAt: draftOrder.created_at || '',
    updatedAt: draftOrder.updated_at || '',
  }
}
