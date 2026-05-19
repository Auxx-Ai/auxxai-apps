import { TextBlock } from '@auxx/sdk/client'
import { shopifyBlock } from './blocks/shopify/shopify.workflow'
import { shopifyTrigger } from './blocks/shopify/triggers/shopify-trigger/shopify-trigger.workflow'
import { cancelShopifyOrderTool } from './tools/cancel-shopify-order.tool'
import { findShopifyCustomerTool } from './tools/find-shopify-customer.tool'
import { findShopifyOrderTool } from './tools/find-shopify-order.tool'
import { getProductInventoryTool } from './tools/get-product-inventory.tool'
import { getShopifyCustomerTool } from './tools/get-shopify-customer.tool'
import { getShopifyOrderTool } from './tools/get-shopify-order.tool'
import { listCustomerOrdersTool } from './tools/list-customer-orders.tool'
import { listShopifyStoresTool } from './tools/list-shopify-stores.tool'
import { refundShopifyOrderTool } from './tools/refund-shopify-order.tool'
import { searchShopifyProductsTool } from './tools/search-shopify-products.tool'
import { summarizeRecentOrdersTool } from './tools/summarize-recent-orders.tool'
import { shopifyToolsets } from './tools/toolsets'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
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
