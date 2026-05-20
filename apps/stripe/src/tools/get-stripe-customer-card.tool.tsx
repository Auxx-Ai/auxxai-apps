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
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeCustomerCardExecute,
  agent: { toolsetSlug: 'stripe.customer-cards.read' },
})
