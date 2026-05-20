// src/tools/cancel-shopify-order.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import cancelShopifyOrderExecute from './cancel-shopify-order.tool.server'

export const cancelShopifyOrderTool = defineTool({
  id: 'cancel_shopify_order',
  name: 'Cancel Shopify order',
  description:
    'Cancel a Shopify order with an optional refund and customer notification. Authorize by enabling the shopify.orders.write toolset on the agent — every invocation is pre-approved at toolset-enablement time.',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyOrderId: z.string().describe('Order GID.'),
    reason: z
      .enum(['customer', 'inventory', 'fraud', 'declined', 'other'])
      .optional()
      .describe('Default other.'),
    refund: z
      .boolean()
      .optional()
      .describe('Issue a refund as part of the cancellation. Default false.'),
    notifyCustomer: z.boolean().optional().describe('Email the customer. Default false.'),
    staffNote: z.string().optional(),
  }),
  outputs: z.object({
    shopifyOrderId: z.string(),
    cancelledAt: z.string(),
    refunded: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: cancelShopifyOrderExecute,
  agent: { toolsetSlug: 'shopify.orders.write' },
})
