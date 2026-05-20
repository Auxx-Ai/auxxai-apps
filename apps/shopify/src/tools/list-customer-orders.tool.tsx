// src/tools/list-customer-orders.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import listCustomerOrdersExecute from './list-customer-orders.tool.server'

export const listCustomerOrdersTool = defineTool({
  id: 'list_customer_orders',
  name: 'List Shopify customer orders',
  description:
    "List a Shopify customer's recent orders. Returns light-weight summaries; use get_shopify_order for full detail on a specific order.",
  icon: shopifyIcon,
  inputs: z.object({
    shopifyCustomerId: z.string().describe('Customer GID (gid://shopify/Customer/...).'),
    limit: z.number().int().min(1).max(50).optional().describe('Default 10.'),
    status: z.enum(['any', 'open', 'closed', 'cancelled']).optional().describe('Default any.'),
  }),
  outputs: z.object({
    orders: z.array(
      z.object({
        shopifyOrderId: z.string(),
        name: z.string().describe('Human-facing order name (#1042).'),
        createdAt: z.string(),
        totalPrice: z.object({ amount: z.string(), currencyCode: z.string() }),
        financialStatus: z.string().nullable(),
        fulfillmentStatus: z.string().nullable(),
        itemsCount: z.number().int(),
      })
    ),
    truncated: z.boolean().describe('True if more orders exist beyond the limit.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listCustomerOrdersExecute,
  agent: { toolsetSlug: 'shopify.customers' },
})
