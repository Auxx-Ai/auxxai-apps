// src/tools/get-stripe-subscription.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeSubscriptionExecute from './get-stripe-subscription.tool.server'

export const subscriptionOutput = z.object({
  subscriptionId: z.string(),
  status: z.enum([
    'active',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'paused',
  ]),
  customer: z.object({
    stripeCustomerId: z.string().nullable(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  items: z.array(
    z.object({
      itemId: z.string(),
      priceId: z.string(),
      productId: z.string(),
      quantity: z.number().int(),
    })
  ),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.string().nullable(),
  trialEnd: z.string().nullable(),
  livemode: z.boolean(),
})

export const getStripeSubscriptionTool = defineTool({
  id: 'get_stripe_subscription',
  name: 'Get Stripe subscription',
  description: 'Fetch a Stripe subscription by id (sub_*).',
  icon: stripeIcon,
  inputs: z.object({ subscriptionId: z.string().describe('Stripe subscription id (sub_*).') }),
  outputs: z.object({ subscription: subscriptionOutput }),
  exampleOutput: {
    subscription: {
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
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeSubscriptionExecute,
  agent: { toolsetSlug: 'stripe.subscriptions.read' },
})
