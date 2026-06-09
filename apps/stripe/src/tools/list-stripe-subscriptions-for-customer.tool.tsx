// src/tools/list-stripe-subscriptions-for-customer.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeSubscriptionsForCustomerExecute from './list-stripe-subscriptions-for-customer.tool.server'
import { subscriptionOutput } from './get-stripe-subscription.tool'

export const listStripeSubscriptionsForCustomerTool = defineTool({
  id: 'list_stripe_subscriptions_for_customer',
  name: 'List Stripe subscriptions for customer',
  description: 'List subscriptions for a specific Stripe customer, optionally filtered by status.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    status: z
      .enum([
        'active',
        'past_due',
        'unpaid',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'paused',
        'all',
      ])
      .optional()
      .describe('Filter by subscription status. Use "all" to include canceled. Default: active.'),
    limit: z.number().int().min(1).max(100).optional().default(20),
  }),
  outputs: z.object({
    subscriptions: z.array(subscriptionOutput),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    subscriptions: [
      {
        subscriptionId: 'sub_1MrabC2eZvKYlo2C',
        status: 'active',
        customer: {
          stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
          auxxRecordId: null,
        },
        items: [
          {
            itemId: 'si_Nffr3xQ1aBcDeF',
            priceId: 'price_1MrabC2eZvKYlo2C',
            productId: 'prod_NffrFeUfNV2Hib',
            quantity: 1,
          },
        ],
        currentPeriodStart: '2026-06-01T00:00:00Z',
        currentPeriodEnd: '2026-07-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        livemode: true,
      },
    ],
    truncated: false,
  },
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripeSubscriptionsForCustomerExecute,
  agent: { toolsetSlug: 'stripe.subscriptions.read' },
})
