// src/tools/refund-shopify-order.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import refundShopifyOrderExecute from './refund-shopify-order.tool.server'

export const refundShopifyOrderTool = defineTool({
  id: 'refund_shopify_order',
  name: 'Refund Shopify order',
  description:
    'Refund a Shopify order — whole-order or flat-amount. Authorize by enabling the shopify.orders.write toolset on the agent. Partial line-item refunds are not exposed here (use the workflow block).',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyOrderId: z.string(),
    amount: z
      .object({
        amount: z.string().describe('Decimal string. Defaults to the order total if omitted.'),
        currencyCode: z.string(),
      })
      .optional(),
    reason: z.string().optional(),
    restock: z.boolean().optional().describe('Restock the line items. Default false.'),
    notifyCustomer: z.boolean().optional().describe('Default false.'),
  }),
  outputs: z.object({
    refundId: z.string(),
    shopifyOrderId: z.string(),
    amount: z.object({ amount: z.string(), currencyCode: z.string() }),
    createdAt: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: refundShopifyOrderExecute,
})
