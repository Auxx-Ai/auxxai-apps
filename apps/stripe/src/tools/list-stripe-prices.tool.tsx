// src/tools/list-stripe-prices.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripePricesExecute from './list-stripe-prices.tool.server'

export const listStripePricesTool = defineTool({
  id: 'list_stripe_prices',
  name: 'List Stripe prices',
  description:
    'List prices on the connected Stripe account, optionally filtered to one product. Use after list_stripe_products to translate a product name into a priceId for subscription / invoice tools.',
  icon: stripeIcon,
  inputs: z.object({
    productId: z
      .string()
      .optional()
      .describe('Filter to one product. Omit to list across products.'),
    active: z.boolean().optional().default(true),
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  outputs: z.object({
    prices: z.array(
      z.object({
        priceId: z.string(),
        productId: z.string(),
        nickname: z.string().nullable(),
        currency: z.string(),
        unitAmount: z
          .number()
          .nullable()
          .describe('Amount in the smallest currency unit (e.g. cents).'),
        recurring: z
          .object({
            interval: z.enum(['day', 'week', 'month', 'year']),
            intervalCount: z.number().int(),
          })
          .nullable(),
        active: z.boolean(),
      })
    ),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    prices: [
      {
        priceId: 'price_1MrabC2eZvKYlo2C',
        productId: 'prod_NffrFeUfNV2Hib',
        nickname: 'Pro Monthly',
        currency: 'usd',
        unitAmount: 2400,
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
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
  execute: listStripePricesExecute,
  agent: {},
})
