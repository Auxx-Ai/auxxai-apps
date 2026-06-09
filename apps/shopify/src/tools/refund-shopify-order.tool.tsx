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
  exampleOutput: {
    refundId: 'gid://shopify/Refund/9281736450',
    shopifyOrderId: 'gid://shopify/Order/5512033210',
    amount: { amount: '74.00', currencyCode: 'USD' },
    createdAt: '2026-06-03T14:22:00Z',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: refundShopifyOrderExecute,
  // Mutating order action. Offered on every surface (default) but NOT
  // `externalSafe`, so a chat/email agent flags it with a warning until an admin
  // locks it down with restrictions. See plans/chat/v6/chat-tool-availability.md.
  agent: { toolsetSlug: 'shopify.orders.write' },
})
