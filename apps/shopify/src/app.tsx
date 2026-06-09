// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { shopifyBlock } from './blocks/shopify/shopify.workflow'
import { cancelShopifyOrderTool } from './tools/cancel-shopify-order.tool'
import { findShopifyCustomerTool } from './tools/find-shopify-customer.tool'
import { findShopifyOrderTool } from './tools/find-shopify-order.tool'
import { getProductInventoryTool } from './tools/get-product-inventory.tool'
import { getShopifyCustomerTool } from './tools/get-shopify-customer.tool'
import { getShopifyOrderTool } from './tools/get-shopify-order.tool'
import { collectionAddProductTool } from './tools/internal/collection-add-product.tool'
import { collectionCreateTool } from './tools/internal/collection-create.tool'
import { collectionDeleteTool } from './tools/internal/collection-delete.tool'
import { collectionGetManyTool } from './tools/internal/collection-get-many.tool'
import { collectionGetTool } from './tools/internal/collection-get.tool'
import { collectionRemoveProductTool } from './tools/internal/collection-remove-product.tool'
import { collectionUpdateTool } from './tools/internal/collection-update.tool'
import { customerAddressCreateTool } from './tools/internal/customer-address-create.tool'
import { customerAddressDeleteTool } from './tools/internal/customer-address-delete.tool'
import { customerAddressGetManyTool } from './tools/internal/customer-address-get-many.tool'
import { customerAddressGetTool } from './tools/internal/customer-address-get.tool'
import { customerAddressSetDefaultTool } from './tools/internal/customer-address-set-default.tool'
import { customerAddressUpdateTool } from './tools/internal/customer-address-update.tool'
import { customerCreateTool } from './tools/internal/customer-create.tool'
import { customerDeleteTool } from './tools/internal/customer-delete.tool'
import { customerGetManyTool } from './tools/internal/customer-get-many.tool'
import { customerGetTool } from './tools/internal/customer-get.tool'
import { customerSearchTool } from './tools/internal/customer-search.tool'
import { customerUpdateTool } from './tools/internal/customer-update.tool'
import { discountCreateTool } from './tools/internal/discount-create.tool'
import { discountDeleteTool } from './tools/internal/discount-delete.tool'
import { discountGetManyTool } from './tools/internal/discount-get-many.tool'
import { discountGetTool } from './tools/internal/discount-get.tool'
import { discountUpdateTool } from './tools/internal/discount-update.tool'
import { draftOrderCompleteTool } from './tools/internal/draft-order-complete.tool'
import { draftOrderCreateTool } from './tools/internal/draft-order-create.tool'
import { draftOrderDeleteTool } from './tools/internal/draft-order-delete.tool'
import { draftOrderGetManyTool } from './tools/internal/draft-order-get-many.tool'
import { draftOrderGetTool } from './tools/internal/draft-order-get.tool'
import { draftOrderSendInvoiceTool } from './tools/internal/draft-order-send-invoice.tool'
import { draftOrderUpdateTool } from './tools/internal/draft-order-update.tool'
import { fulfillmentCancelTool } from './tools/internal/fulfillment-cancel.tool'
import { fulfillmentCreateTool } from './tools/internal/fulfillment-create.tool'
import { fulfillmentGetManyTool } from './tools/internal/fulfillment-get-many.tool'
import { fulfillmentGetTool } from './tools/internal/fulfillment-get.tool'
import { fulfillmentUpdateTool } from './tools/internal/fulfillment-update.tool'
import { inventoryItemGetManyTool } from './tools/internal/inventory-item-get-many.tool'
import { inventoryItemGetTool } from './tools/internal/inventory-item-get.tool'
import { inventoryItemUpdateTool } from './tools/internal/inventory-item-update.tool'
import { inventoryLevelAdjustTool } from './tools/internal/inventory-level-adjust.tool'
import { inventoryLevelConnectTool } from './tools/internal/inventory-level-connect.tool'
import { inventoryLevelDeleteTool } from './tools/internal/inventory-level-delete.tool'
import { inventoryLevelGetManyTool } from './tools/internal/inventory-level-get-many.tool'
import { inventoryLevelSetTool } from './tools/internal/inventory-level-set.tool'
import { metafieldCreateTool } from './tools/internal/metafield-create.tool'
import { metafieldDeleteTool } from './tools/internal/metafield-delete.tool'
import { metafieldGetManyTool } from './tools/internal/metafield-get-many.tool'
import { metafieldGetTool } from './tools/internal/metafield-get.tool'
import { metafieldUpdateTool } from './tools/internal/metafield-update.tool'
import { orderCreateTool } from './tools/internal/order-create.tool'
import { orderDeleteTool } from './tools/internal/order-delete.tool'
import { orderGetManyTool } from './tools/internal/order-get-many.tool'
import { orderGetTool } from './tools/internal/order-get.tool'
import { orderUpdateTool } from './tools/internal/order-update.tool'
import { productCreateTool } from './tools/internal/product-create.tool'
import { productDeleteTool } from './tools/internal/product-delete.tool'
import { productGetManyTool } from './tools/internal/product-get-many.tool'
import { productGetTool } from './tools/internal/product-get.tool'
import { productUpdateTool } from './tools/internal/product-update.tool'
import { variantCreateTool } from './tools/internal/variant-create.tool'
import { variantDeleteTool } from './tools/internal/variant-delete.tool'
import { variantGetManyTool } from './tools/internal/variant-get-many.tool'
import { variantGetTool } from './tools/internal/variant-get.tool'
import { variantUpdateTool } from './tools/internal/variant-update.tool'
import { listCustomerOrdersTool } from './tools/list-customer-orders.tool'
import { listShopifyStoresTool } from './tools/list-shopify-stores.tool'
import { refundShopifyOrderTool } from './tools/refund-shopify-order.tool'
import { searchShopifyProductsTool } from './tools/search-shopify-products.tool'
import { summarizeRecentOrdersTool } from './tools/summarize-recent-orders.tool'
import { shopifyToolsets } from './tools/toolsets'
import { shopifyTrigger } from './triggers/shopify-trigger/shopify-trigger.workflow'
import { shopifyFields } from './fields'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  // Contact fields the app owns, provisioned per connected store. See ./fields.ts.
  fields: shopifyFields,
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [shopifyBlock],
    triggers: [shopifyTrigger],
  },
  tools: [
    // Agent-facing tools
    listShopifyStoresTool,
    findShopifyCustomerTool,
    getShopifyCustomerTool,
    listCustomerOrdersTool,
    findShopifyOrderTool,
    getShopifyOrderTool,
    summarizeRecentOrdersTool,
    cancelShopifyOrderTool,
    refundShopifyOrderTool,
    searchShopifyProductsTool,
    getProductInventoryTool,
    // Internal tools — back the Shopify block's dispatcher, no agent/action surface.
    orderCreateTool,
    orderDeleteTool,
    orderGetTool,
    orderGetManyTool,
    orderUpdateTool,
    productCreateTool,
    productDeleteTool,
    productGetTool,
    productGetManyTool,
    productUpdateTool,
    customerCreateTool,
    customerUpdateTool,
    customerGetTool,
    customerGetManyTool,
    customerDeleteTool,
    customerSearchTool,
    customerAddressCreateTool,
    customerAddressUpdateTool,
    customerAddressGetTool,
    customerAddressGetManyTool,
    customerAddressDeleteTool,
    customerAddressSetDefaultTool,
    variantCreateTool,
    variantUpdateTool,
    variantGetTool,
    variantGetManyTool,
    variantDeleteTool,
    inventoryItemGetTool,
    inventoryItemGetManyTool,
    inventoryItemUpdateTool,
    inventoryLevelGetManyTool,
    inventoryLevelSetTool,
    inventoryLevelAdjustTool,
    inventoryLevelConnectTool,
    inventoryLevelDeleteTool,
    metafieldCreateTool,
    metafieldUpdateTool,
    metafieldGetTool,
    metafieldGetManyTool,
    metafieldDeleteTool,
    fulfillmentCreateTool,
    fulfillmentUpdateTool,
    fulfillmentGetTool,
    fulfillmentGetManyTool,
    fulfillmentCancelTool,
    draftOrderCreateTool,
    draftOrderUpdateTool,
    draftOrderGetTool,
    draftOrderGetManyTool,
    draftOrderDeleteTool,
    draftOrderCompleteTool,
    draftOrderSendInvoiceTool,
    collectionCreateTool,
    collectionUpdateTool,
    collectionGetTool,
    collectionGetManyTool,
    collectionDeleteTool,
    collectionAddProductTool,
    collectionRemoveProductTool,
    discountCreateTool,
    discountUpdateTool,
    discountGetTool,
    discountGetManyTool,
    discountDeleteTool,
  ],
  toolsets: shopifyToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Shopify</TextBlock>
      <TextBlock align="left">
        Manage orders and products in your Shopify store. Connect your store via OAuth to get
        started.
      </TextBlock>
    </>
  )
}
