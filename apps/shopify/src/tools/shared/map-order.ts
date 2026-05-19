// src/tools/shared/map-order.ts

/**
 * Tool-surface mappers for Shopify Order resources (REST).
 *
 * See plans/kopilot/apps/shopify-overhaul.md §7.
 */
import { customerGid, gidToNumeric, orderGid } from './map-customer'

export interface OrderSummary {
  shopifyOrderId: string
  name: string
  createdAt: string
  totalPrice: { amount: string; currencyCode: string }
  financialStatus: string | null
  fulfillmentStatus: string | null
  itemsCount: number
}

export interface OrderDetail extends Omit<OrderSummary, 'itemsCount'> {
  updatedAt: string
  customer: {
    auxxRecordId: string | null
    shopifyId: string
    email: string | null
    fullName: string | null
  } | null
  subtotalPrice: { amount: string; currencyCode: string }
  totalTax: { amount: string; currencyCode: string }
  totalShipping: { amount: string; currencyCode: string }
  cancelledAt: string | null
  cancelReason: string | null
  lineItems: Array<{
    title: string
    quantity: number
    sku: string | null
    price: { amount: string; currencyCode: string }
    variantTitle: string | null
  }>
  shippingAddress: {
    address1: string | null
    city: string | null
    country: string | null
    zip: string | null
  } | null
  trackingInfo: Array<{ company: string | null; number: string | null; url: string | null }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrderSummary(o: any, defaultCurrency: string): OrderSummary {
  const currency = o.currency ?? defaultCurrency
  return {
    shopifyOrderId: orderGid(o.id),
    name: o.name ?? `#${o.order_number ?? o.id}`,
    createdAt: o.created_at ?? '',
    totalPrice: { amount: priceString(o.total_price), currencyCode: currency },
    financialStatus: o.financial_status ?? null,
    fulfillmentStatus: o.fulfillment_status ?? null,
    itemsCount: Array.isArray(o.line_items) ? o.line_items.length : 0,
  }
}

export function mapOrderDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  o: any,
  defaultCurrency: string,
  auxxContactRecordId: string | null
): OrderDetail {
  const currency = o.currency ?? defaultCurrency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillments: any[] = Array.isArray(o.fulfillments) ? o.fulfillments : []
  const trackingInfo = fulfillments.flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any): Array<{ company: string | null; number: string | null; url: string | null }> => {
      // Shopify returns either tracking_numbers/tracking_urls arrays or a flat
      // tracking_number/tracking_url. Normalize both into the same shape.
      const company = f.tracking_company ?? null
      const numbers: string[] = Array.isArray(f.tracking_numbers)
        ? f.tracking_numbers
        : f.tracking_number
          ? [f.tracking_number]
          : []
      const urls: string[] = Array.isArray(f.tracking_urls)
        ? f.tracking_urls
        : f.tracking_url
          ? [f.tracking_url]
          : []
      const len = Math.max(numbers.length, urls.length, 1)
      const rows = [] as Array<{
        company: string | null
        number: string | null
        url: string | null
      }>
      for (let i = 0; i < len; i++) {
        rows.push({ company, number: numbers[i] ?? null, url: urls[i] ?? null })
      }
      // Suppress empty rows when fulfillment has no tracking at all.
      return rows.filter((r) => r.number || r.url || r.company)
    }
  )

  const customer = o.customer
    ? {
        auxxRecordId: auxxContactRecordId,
        shopifyId: customerGid(o.customer.id),
        email: o.customer.email ?? null,
        fullName:
          [o.customer.first_name, o.customer.last_name].filter(Boolean).join(' ').trim() || null,
      }
    : null

  return {
    shopifyOrderId: orderGid(o.id),
    name: o.name ?? `#${o.order_number ?? o.id}`,
    createdAt: o.created_at ?? '',
    updatedAt: o.updated_at ?? '',
    customer,
    totalPrice: { amount: priceString(o.total_price), currencyCode: currency },
    subtotalPrice: { amount: priceString(o.subtotal_price), currencyCode: currency },
    totalTax: { amount: priceString(o.total_tax), currencyCode: currency },
    totalShipping: {
      amount: priceString(o.total_shipping_price_set?.shop_money?.amount ?? '0.00'),
      currencyCode: currency,
    },
    financialStatus: o.financial_status ?? null,
    fulfillmentStatus: o.fulfillment_status ?? null,
    cancelledAt: o.cancelled_at ?? null,
    cancelReason: o.cancel_reason ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lineItems: (o.line_items ?? []).map((li: any) => ({
      title: li.title ?? '',
      quantity: typeof li.quantity === 'number' ? li.quantity : 0,
      sku: li.sku ?? null,
      price: { amount: priceString(li.price), currencyCode: currency },
      variantTitle: li.variant_title ?? null,
    })),
    shippingAddress: o.shipping_address
      ? {
          address1: o.shipping_address.address1 ?? null,
          city: o.shipping_address.city ?? null,
          country: o.shipping_address.country ?? null,
          zip: o.shipping_address.zip ?? null,
        }
      : null,
    trackingInfo,
  }
}

function priceString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return v.toFixed(2)
  return '0.00'
}

export function numericOrderId(gid: string): string {
  return gidToNumeric(gid)
}
