// src/tools/summarize-recent-orders.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric, orderGid } from './shared/map-customer'

interface SummarizeRecentOrdersInput {
  shopifyCustomerId?: string
  since?: string
  limit?: number
}

interface TrimmedOrder {
  shopifyOrderId: string
  name: string
  createdAt: string
  totalPrice: { amount: string; currencyCode: string }
  financialStatus: string | null
  fulfillmentStatus: string | null
  itemsCount: number
  topSku: string | null
}

interface SummarizeRecentOrdersOutput {
  summary: string
  orders: TrimmedOrder[]
}

/**
 * Streaming tool — fans out across recent Shopify orders, yielding progress
 * after each fetch so the chat UI can show "Loading order 3 of 8…". The
 * lambda's streaming executor forwards yields as SSE `event: progress`
 * frames; the generator's `return` becomes the terminal `event: result`.
 *
 * See plans/kopilot/apps/shopify-overhaul.md §4.7 / §7.
 */
export default async function* summarizeRecentOrders(
  input: SummarizeRecentOrdersInput
): AsyncGenerator<{ kind: string; data: unknown }, SummarizeRecentOrdersOutput, void> {
  const { token, shopDomain } = getShopifyConnection()
  const limit = Math.min(input.limit ?? 10, 50)
  const since = input.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  yield { kind: 'phase', data: { phase: 'starting', limit } }

  // List recent order ids (light call). Per-customer goes through the
  // customer-orders endpoint; store-wide uses the orders endpoint.
  const qs: Record<string, string> = {
    status: 'any',
    limit: String(limit),
    order: 'created_at desc',
    created_at_min: since,
    fields: 'id,name,created_at',
  }

  let listPath = '/orders.json'
  if (input.shopifyCustomerId) {
    const numericCustomerId = gidToNumeric(input.shopifyCustomerId)
    listPath = `/customers/${encodeURIComponent(numericCustomerId)}/orders.json`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listResult = await shopifyApi<{ orders: any[] }>(shopDomain, token, listPath, { qs })
  const ids = (listResult.orders ?? []).map((o) => ({
    id: o.id as number,
    name: o.name as string,
  }))

  yield { kind: 'phase', data: { phase: 'found', total: ids.length } }

  if (ids.length === 0) {
    return {
      summary: 'No orders matched the requested window.',
      orders: [],
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  const defaultCurrency = shop.shop?.currency ?? 'USD'

  const trimmed: TrimmedOrder[] = []
  for (let i = 0; i < ids.length; i++) {
    const meta = ids[i]
    yield {
      kind: 'phase',
      data: {
        phase: 'fetching',
        idx: i + 1,
        total: ids.length,
        orderName: meta.name,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = await shopifyApi<{ order: any }>(
      shopDomain,
      token,
      `/orders/${encodeURIComponent(String(meta.id))}.json`
    )
    const o = detail.order
    if (!o) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = Array.isArray(o.line_items) ? o.line_items : []
    const topLi = lineItems.reduce<{ sku: string | null; qty: number }>(
      (best, li) => {
        const qty = typeof li.quantity === 'number' ? li.quantity : 0
        if (qty > best.qty) return { sku: li.sku ?? null, qty }
        return best
      },
      { sku: null, qty: 0 }
    )

    trimmed.push({
      shopifyOrderId: orderGid(o.id),
      name: o.name ?? `#${o.order_number ?? o.id}`,
      createdAt: o.created_at ?? '',
      totalPrice: {
        amount: typeof o.total_price === 'string' ? o.total_price : '0.00',
        currencyCode: o.currency ?? defaultCurrency,
      },
      financialStatus: o.financial_status ?? null,
      fulfillmentStatus: o.fulfillment_status ?? null,
      itemsCount: lineItems.length,
      topSku: topLi.sku,
    })

    yield {
      kind: 'phase',
      data: {
        phase: 'fetched',
        idx: i + 1,
        total: ids.length,
        orderName: meta.name,
      },
    }
  }

  return { summary: buildSummary(trimmed, defaultCurrency), orders: trimmed }
}

function buildSummary(orders: TrimmedOrder[], defaultCurrency: string): string {
  if (orders.length === 0) return 'No orders matched the requested window.'

  const gmv = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice.amount || '0'), 0)
  const currency = orders[0]?.totalPrice.currencyCode ?? defaultCurrency

  const skuCounts = new Map<string, number>()
  for (const o of orders) {
    if (o.topSku) skuCounts.set(o.topSku, (skuCounts.get(o.topSku) ?? 0) + 1)
  }
  const topSkus = [...skuCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([sku, count]) => `${sku} (${count})`)
    .join(', ')

  const fulfillmentCounts = new Map<string, number>()
  for (const o of orders) {
    const key = o.fulfillmentStatus ?? 'unfulfilled'
    fulfillmentCounts.set(key, (fulfillmentCounts.get(key) ?? 0) + 1)
  }
  const fulfillmentBreakdown = [...fulfillmentCounts.entries()]
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  return [
    `${orders.length} orders, GMV ${gmv.toFixed(2)} ${currency}.`,
    topSkus ? `Top SKUs: ${topSkus}.` : null,
    `Fulfillment: ${fulfillmentBreakdown}.`,
  ]
    .filter(Boolean)
    .join(' ')
}
