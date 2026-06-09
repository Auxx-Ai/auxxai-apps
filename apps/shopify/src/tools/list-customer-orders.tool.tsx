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
  exampleOutput: {
    orders: [
      {
        shopifyOrderId: 'gid://shopify/Order/5512033210',
        name: '#1042',
        createdAt: '2026-06-01T16:30:00Z',
        totalPrice: { amount: '74.00', currencyCode: 'USD' },
        financialStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        itemsCount: 3,
      },
      {
        shopifyOrderId: 'gid://shopify/Order/5498871002',
        name: '#1037',
        createdAt: '2026-05-18T11:05:00Z',
        totalPrice: { amount: '29.00', currencyCode: 'USD' },
        financialStatus: 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        itemsCount: 1,
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listCustomerOrdersExecute,
  agent: {
    toolsetSlug: 'shopify.customers',
    // Verified safe for a visitor: `shopifyCustomerId` is bound to the verified
    // contact's Shopify customer id (see inputBindings), so the model can never
    // widen the scope. See plans/chat/v8.
    externalSafe: true,
    idempotent: true,
    // Author-default binding (v8 phase-3): the platform resolves
    // `contact:@app:shopify:customerId` from the turn subject and clamps it onto
    // `shopifyCustomerId` before execute — the model never supplies it. The input
    // is required (see `inputs`), so an anonymous turn (the var resolves empty)
    // refuses the call rather than running unscoped. The `@app:` segment resolves
    // at turn time against the agent's bound store; the field is owned by this
    // app (see ../fields.ts).
    inputBindings: [
      {
        name: 'shopifyCustomerId',
        default: { kind: 'var', ref: 'contact:@app:shopify:customerId' },
      },
    ],
  },
})
