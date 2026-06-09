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
  exampleOutput: {
    summary:
      '8 orders in the last 30 days totaling $612.00 GMV. Top SKU: TEE-CLS-BLK-M (5 units). Fulfillment: 6 FULFILLED, 2 UNFULFILLED.',
    orders: [
      {
        shopifyOrderId: 'gid://shopify/Order/5512033210',
        name: '#1042',
        createdAt: '2026-06-01T16:30:00Z',
        totalPrice: { amount: '74.00', currencyCode: 'USD' },
        financialStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        itemsCount: 3,
        topSku: 'TEE-CLS-BLK-M',
      },
      {
        shopifyOrderId: 'gid://shopify/Order/5512033188',
        name: '#1039',
        createdAt: '2026-05-24T11:02:00Z',
        totalPrice: { amount: '28.00', currencyCode: 'USD' },
        financialStatus: 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        itemsCount: 1,
        topSku: 'TEE-CLS-BLK-L',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 60000,
    streaming: true,
  },
  execute: summarizeRecentOrdersExecute,
  agent: {
    toolsetSlug: 'shopify.orders.read',
    streaming: true,
    // NOT `externalSafe`. `shopifyCustomerId` is bound to the verified contact
    // (see inputBindings) so a logged-in visitor is scoped to their own orders —
    // but the input is *optional* (store-wide fallback for internal agents), and
    // v8's gate only refuses *required* inputs. So an anonymous turn (the var
    // resolves empty) would fall through to the store-wide rollup. The old
    // `identityScopedInputs` fail-closed that path; v8 binding can't, so this
    // tool is no longer advertised visitor-safe — the chat/email Tools UI flags
    // it and an admin must opt in deliberately. See plans/chat/v8.
    inputBindings: [
      {
        name: 'shopifyCustomerId',
        default: { kind: 'var', ref: 'contact:@app:shopify:customerId' },
      },
    ],
  },
})
