// src/tools/summarize-recent-orders.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import summarizeRecentOrdersExecute from './summarize-recent-orders.tool.server'

const TrimmedOrder = z.object({
  shopifyOrderId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  totalPrice: z.object({ amount: z.string(), currencyCode: z.string() }),
  financialStatus: z.string().nullable(),
  fulfillmentStatus: z.string().nullable(),
  itemsCount: z.number().int(),
  topSku: z.string().nullable(),
})

export const summarizeRecentOrdersTool = defineTool({
  id: 'summarize_recent_orders',
  name: 'Summarize recent Shopify orders',
  description:
    'Fan out across recent Shopify orders, emit per-order progress as the lookup proceeds, and return a rollup summary (totals, GMV, top SKUs, fulfillment-status breakdown). Restrict by customer or store-wide.',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyCustomerId: z
      .string()
      .optional()
      .describe('Restrict to this customer. Omit for store-wide recent orders.'),
    since: z.string().optional().describe('ISO 8601 lower bound. Default: 30 days ago.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Default 10. Hard max 50 (chat budget).'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('LLM-readable rollup: total orders, GMV, top SKUs, fulfillment-status breakdown.'),
    orders: z.array(TrimmedOrder),
  }),
  config: {
    requiresConnection: true,
    timeout: 60000,
    streaming: true,
  },
  execute: summarizeRecentOrdersExecute,
  agent: { toolsetSlug: 'shopify.orders.read', streaming: true },
})
