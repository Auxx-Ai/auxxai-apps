// src/tools/get-shopify-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import getShopifyCustomerExecute from './get-shopify-customer.tool.server'

export const getShopifyCustomerTool = defineTool({
  id: 'get_shopify_customer',
  name: 'Get Shopify customer',
  description:
    'Get the full Shopify customer profile (including default address and recent order ids) by Shopify customer GID.',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyCustomerId: z
      .string()
      .describe(
        'Customer GID (gid://shopify/Customer/...) from a prior find_shopify_customer call.'
      ),
  }),
  outputs: z.object({
    found: z.boolean(),
    customer: z
      .object({
        auxxRecordId: refs.entity('contact').nullable(),
        shopifyId: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        createdAt: z.string(),
        ordersCount: z.number().int(),
        totalSpent: z.object({ amount: z.string(), currencyCode: z.string() }),
        state: z.enum(['disabled', 'invited', 'enabled', 'declined']),
        tags: z.array(z.string()),
        defaultAddress: z
          .object({
            address1: z.string().nullable(),
            city: z.string().nullable(),
            country: z.string().nullable(),
            zip: z.string().nullable(),
          })
          .nullable(),
        recentOrderIds: z
          .array(z.string())
          .max(5)
          .describe('Up to 5 most recent order GIDs. Use list_customer_orders for full details.'),
      })
      .nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  exampleOutput: {
    found: true,
    customer: {
      // refs.entity('contact') marker — null or a sample RecordId both validate.
      auxxRecordId: null,
      shopifyId: 'gid://shopify/Customer/6820315234',
      email: 'jane@example.com',
      phone: '+14155550132',
      firstName: 'Jane',
      lastName: 'Cooper',
      createdAt: '2025-11-02T08:14:00Z',
      ordersCount: 7,
      totalSpent: { amount: '482.50', currencyCode: 'USD' },
      state: 'enabled',
      tags: ['vip', 'newsletter'],
      defaultAddress: {
        address1: '548 Market St',
        city: 'San Francisco',
        country: 'United States',
        zip: '94104',
      },
      recentOrderIds: ['gid://shopify/Order/5512033210', 'gid://shopify/Order/5498871002'],
    },
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getShopifyCustomerExecute,
  agent: {
    toolsetSlug: 'shopify.customers',
    // Not `externalSafe` (full PII profile — chat/email agents flag it with a
    // warning), but if an admin adds it to such an agent the customer-scope arg
    // is still bound to the verified contact. Defense-in-depth. See plans/chat/v8.
    // Author-default binding (v8 phase-3): `shopifyCustomerId` is clamped to the
    // turn subject's `contact:@app:shopify:customerId`; the model never supplies
    // it, and an anonymous turn refuses (the input is required, var resolves empty).
    inputBindings: [
      {
        name: 'shopifyCustomerId',
        default: { kind: 'var', ref: 'contact:@app:shopify:customerId' },
      },
    ],
  },
})
