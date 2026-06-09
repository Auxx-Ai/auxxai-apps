// src/tools/get-stripe-customer-card.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeCustomerCardExecute from './get-stripe-customer-card.tool.server'
import { cardOutput } from './list-stripe-customer-cards.tool'

export const getStripeCustomerCardTool = defineTool({
  id: 'get_stripe_customer_card',
  name: 'Get Stripe customer card',
  description: 'Fetch a specific card attached to a Stripe customer.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    cardId: z.string(),
  }),
  outputs: z.object({ card: cardOutput }),
  exampleOutput: {
    card: {
      cardId: 'card_1MrabC2eZvKYlo2CqwPpVzwm',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2028,
      funding: 'credit',
      isDefault: true,
    },
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeCustomerCardExecute,
  agent: { toolsetSlug: 'stripe.customer-cards.read' },
})
