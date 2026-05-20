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
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getShopifyCustomerExecute,
  agent: { toolsetSlug: 'shopify.customers' },
})
