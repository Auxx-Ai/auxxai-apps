// src/blocks/shopify/shopify-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const shopifyToolMap = {
  // order
  'order.create': 'block_shopify_order_create',
  'order.delete': 'block_shopify_order_delete',
  'order.get': 'block_shopify_order_get',
  'order.getMany': 'block_shopify_order_get_many',
  'order.update': 'block_shopify_order_update',
  // product
  'product.create': 'block_shopify_product_create',
  'product.delete': 'block_shopify_product_delete',
  'product.get': 'block_shopify_product_get',
  'product.getMany': 'block_shopify_product_get_many',
  'product.update': 'block_shopify_product_update',
  // customer
  'customer.create': 'block_shopify_customer_create',
  'customer.update': 'block_shopify_customer_update',
  'customer.get': 'block_shopify_customer_get',
  'customer.getMany': 'block_shopify_customer_get_many',
  'customer.delete': 'block_shopify_customer_delete',
  'customer.search': 'block_shopify_customer_search',
  // customerAddress
  'customerAddress.create': 'block_shopify_customer_address_create',
  'customerAddress.update': 'block_shopify_customer_address_update',
  'customerAddress.get': 'block_shopify_customer_address_get',
  'customerAddress.getMany': 'block_shopify_customer_address_get_many',
  'customerAddress.delete': 'block_shopify_customer_address_delete',
  'customerAddress.setDefault': 'block_shopify_customer_address_set_default',
  // variant
  'variant.create': 'block_shopify_variant_create',
  'variant.update': 'block_shopify_variant_update',
  'variant.get': 'block_shopify_variant_get',
  'variant.getMany': 'block_shopify_variant_get_many',
  'variant.delete': 'block_shopify_variant_delete',
  // inventoryItem
  'inventoryItem.get': 'block_shopify_inventory_item_get',
  'inventoryItem.getMany': 'block_shopify_inventory_item_get_many',
  'inventoryItem.update': 'block_shopify_inventory_item_update',
  // inventoryLevel
  'inventoryLevel.getMany': 'block_shopify_inventory_level_get_many',
  'inventoryLevel.set': 'block_shopify_inventory_level_set',
  'inventoryLevel.adjust': 'block_shopify_inventory_level_adjust',
  'inventoryLevel.connect': 'block_shopify_inventory_level_connect',
  'inventoryLevel.delete': 'block_shopify_inventory_level_delete',
  // metafield
  'metafield.create': 'block_shopify_metafield_create',
  'metafield.update': 'block_shopify_metafield_update',
  'metafield.get': 'block_shopify_metafield_get',
  'metafield.getMany': 'block_shopify_metafield_get_many',
  'metafield.delete': 'block_shopify_metafield_delete',
  // fulfillment
  'fulfillment.create': 'block_shopify_fulfillment_create',
  'fulfillment.update': 'block_shopify_fulfillment_update',
  'fulfillment.get': 'block_shopify_fulfillment_get',
  'fulfillment.getMany': 'block_shopify_fulfillment_get_many',
  'fulfillment.cancel': 'block_shopify_fulfillment_cancel',
  // draftOrder
  'draftOrder.create': 'block_shopify_draft_order_create',
  'draftOrder.update': 'block_shopify_draft_order_update',
  'draftOrder.get': 'block_shopify_draft_order_get',
  'draftOrder.getMany': 'block_shopify_draft_order_get_many',
  'draftOrder.delete': 'block_shopify_draft_order_delete',
  'draftOrder.complete': 'block_shopify_draft_order_complete',
  'draftOrder.sendInvoice': 'block_shopify_draft_order_send_invoice',
  // collection
  'collection.create': 'block_shopify_collection_create',
  'collection.update': 'block_shopify_collection_update',
  'collection.get': 'block_shopify_collection_get',
  'collection.getMany': 'block_shopify_collection_get_many',
  'collection.delete': 'block_shopify_collection_delete',
  'collection.addProduct': 'block_shopify_collection_add_product',
  'collection.removeProduct': 'block_shopify_collection_remove_product',
  // discount
  'discount.create': 'block_shopify_discount_create',
  'discount.update': 'block_shopify_discount_update',
  'discount.get': 'block_shopify_discount_get',
  'discount.getMany': 'block_shopify_discount_get_many',
  'discount.delete': 'block_shopify_discount_delete',
} as const

export type ShopifyToolMap = typeof shopifyToolMap
