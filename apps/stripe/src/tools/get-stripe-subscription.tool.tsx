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
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeSubscriptionExecute,
  agent: { toolsetSlug: 'stripe.subscriptions.read' },
})
