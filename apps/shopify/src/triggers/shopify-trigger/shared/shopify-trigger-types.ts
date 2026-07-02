// src/triggers/shopify-trigger/shared/shopify-trigger-types.ts

function decimalToCents(decimal: string | number): number {
  return Math.round(parseFloat(String(decimal)) * 100)
}

/**
 * Stable per-delivery identity token for webhook dedup. Most Shopify topics carry a
 * top-level `id`, but an `inventory_levels/*` payload has NONE
 * (`{ inventory_item_id, location_id, available, updated_at }`) — so `payload.id`
 * collapses every delivery to `…-undefined` and dedup breaks. Key those off the
 * natural composite instead so repeat deliveries dedupe and distinct level changes
 * stay distinct.
 */
export function payloadEventKey(topic: string, payload: Record<string, any>): string {
  const [resourceType] = topic.split('/')
  if (resourceType === 'inventory_levels') {
    return `${payload.inventory_item_id ?? 'x'}-${payload.location_id ?? 'x'}-${payload.updated_at ?? ''}`
  }
  return String(payload.id ?? payload.admin_graphql_api_id ?? Date.now())
}

export function extractTriggerData(
  topic: string,
  shopDomain: string,
  payload: Record<string, any>
): Record<string, unknown> | null {
  const [resourceType] = topic.split('/')

  let resourceId = ''
  let resourceName = ''
  let email = ''
  let totalPrice = 0
  let createdAt = ''
  let updatedAt = ''

  if (resourceType === 'orders') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.name || ''
    email = payload.email || ''
    totalPrice = decimalToCents(payload.total_price || '0')
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'products') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.title || ''
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'customers') {
    resourceId = String(payload.id ?? '')
    resourceName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim()
    email = payload.email || ''
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'fulfillments') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.tracking_company || ''
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'draft_orders') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.name || ''
    email = payload.email || ''
    totalPrice = decimalToCents(payload.total_price || '0')
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'inventory_levels') {
    resourceId = String(payload.inventory_item_id ?? '')
    resourceName = `Item ${payload.inventory_item_id} @ Location ${payload.location_id}`
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'collections') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.title || ''
    createdAt = payload.created_at || ''
    updatedAt = payload.updated_at || ''
  } else if (resourceType === 'refunds') {
    resourceId = String(payload.id ?? '')
    createdAt = payload.created_at || ''
  } else if (resourceType === 'app') {
    resourceId = shopDomain
    resourceName = shopDomain
  } else {
    return null
  }

  return {
    eventId: `${topic}-${payloadEventKey(topic, payload)}`,
    topic,
    shopDomain,
    payload,
    resourceId,
    resourceName,
    email,
    totalPrice,
    createdAt,
    updatedAt,
  }
}
