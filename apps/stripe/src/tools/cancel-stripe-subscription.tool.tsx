// src/tools/cancel-stripe-subscription.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import cancelStripeSubscriptionExecute from './cancel-stripe-subscription.tool.server'
import { subscriptionOutput } from './get-stripe-subscription.tool'

export const cancelStripeSubscriptionTool = defineTool({
  id: 'cancel_stripe_subscription',
  name: 'Cancel Stripe subscription',
  description:
    'Cancel a Stripe subscription. cancelAtPeriodEnd=true schedules cancellation at the current period end (graceful, reversible until then); false cancels immediately.',
  icon: stripeIcon,
  inputs: z.object({
    subscriptionId: z.string(),
    cancelAtPeriodEnd: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'true = schedule cancellation at current period end (graceful). false = cancel immediately.'
      ),
    cancellationReason: z
      .string()
      .optional()
      .describe('Free-form note stored in subscription.metadata.cancellation_reason.'),
  }),
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
      cancelAtPeriodEnd: true,
      canceledAt: null,
      trialEnd: null,
      livemode: true,
    },
  },
  config: { requiresConnection: true, timeout: 20000 },
  execute: cancelStripeSubscriptionExecute,
  agent: { toolsetSlug: 'stripe.subscriptions.write' },
})
