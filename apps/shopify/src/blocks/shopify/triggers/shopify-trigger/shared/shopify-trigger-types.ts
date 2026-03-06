// src/blocks/shopify/triggers/shopify-trigger/shared/shopify-trigger-types.ts

export function extractTriggerData(
  topic: string,
  shopDomain: string,
  payload: Record<string, any>
): Record<string, unknown> | null {
  const [resourceType] = topic.split('/')

  let resourceId = ''
  let resourceName = ''
  let email = ''
  let totalPrice = ''
  let createdAt = ''
  let updatedAt = ''

  if (resourceType === 'orders') {
    resourceId = String(payload.id ?? '')
    resourceName = payload.name || ''
    email = payload.email || ''
    totalPrice = payload.total_price || ''
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
    totalPrice = payload.total_price || ''
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
    eventId: `${topic}-${payload.id ?? Date.now()}`,
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
