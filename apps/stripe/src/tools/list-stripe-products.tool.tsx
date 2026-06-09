// src/tools/list-stripe-products.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeProductsExecute from './list-stripe-products.tool.server'

export const listStripeProductsTool = defineTool({
  id: 'list_stripe_products',
  name: 'List Stripe products',
  description:
    'List products on the connected Stripe account. Use as a preflight before tools that take a productId or priceId — chat callers know product names, the API needs ids.',
  icon: stripeIcon,
  inputs: z.object({
    active: z
      .boolean()
      .optional()
      .default(true)
      .describe('Filter to active products. Default true.'),
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  outputs: z.object({
    products: z.array(
      z.object({
        productId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        active: z.boolean(),
      })
    ),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    products: [
      {
        productId: 'prod_NffrFeUfNV2Hib',
        name: 'Pro Plan',
        description: 'Full access to all features.',
        active: true,
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
    idempotent: true,
  },
  execute: listStripeProductsExecute,
  agent: {},
})
