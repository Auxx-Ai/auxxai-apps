// src/tools/find-shopify-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import findShopifyCustomerExecute from './find-shopify-customer.tool.server'

export const findShopifyCustomerTool = defineTool({
  id: 'find_shopify_customer',
  name: 'Find Shopify customer',
  description:
    'Look up a Shopify customer by email or phone. Returns Shopify profile data plus the Auxx contact recordId when the customer has been imported.',
  icon: shopifyIcon,
  inputs: z
    .object({
      email: z
        .string()
        .email()
        .optional()
        .describe('Customer email. Provide email OR phone, not both.'),
      phone: z
        .string()
        .optional()
        .describe('Customer phone in E.164 (e.g. +14155551212). Provide email OR phone.'),
    })
    .refine((v) => (v.email ? 1 : 0) + (v.phone ? 1 : 0) === 1, {
      message: 'Provide exactly one of email or phone.',
    }),
  outputs: z.object({
    found: z.boolean(),
    customer: z
      .object({
        auxxRecordId: refs
          .entity('contact')
          .nullable()
          .describe(
            'Auxx contact record id, or null if not imported yet. Use this id in `auxx:entity-card` fences.'
          ),
        shopifyId: z.string().describe('Customer GID (gid://shopify/Customer/...).'),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        createdAt: z.string().describe('Customer creation ISO 8601.'),
        ordersCount: z.number().int(),
        totalSpent: z.object({
          amount: z.string().describe('Decimal string (Shopify returns this as a string).'),
          currencyCode: z.string(),
        }),
        state: z.enum(['disabled', 'invited', 'enabled', 'declined']),
        tags: z.array(z.string()),
      })
      .nullable(),
    notImportedReason: z
      .enum(['NOT_IMPORTED'])
      .optional()
      .describe(
        'Set when the Shopify customer exists but has no Auxx contact record (sync delay or never imported).'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findShopifyCustomerExecute,
  agent: { toolsetSlug: 'shopify.customers' },
})
