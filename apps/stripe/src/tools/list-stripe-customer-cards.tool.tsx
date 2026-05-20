// src/tools/list-stripe-customer-cards.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeCustomerCardsExecute from './list-stripe-customer-cards.tool.server'

export const cardOutput = z.object({
  cardId: z.string(),
  brand: z.string().describe('visa / mastercard / amex / …'),
  last4: z.string(),
  expMonth: z.number().int(),
  expYear: z.number().int(),
  funding: z.enum(['credit', 'debit', 'prepaid', 'unknown']),
  isDefault: z.boolean(),
})

export const listStripeCustomerCardsTool = defineTool({
  id: 'list_stripe_customer_cards',
  name: 'List Stripe customer cards',
  description: 'List cards attached to a Stripe customer.',
  icon: stripeIcon,
  inputs: z.object({ stripeCustomerId: z.string() }),
  outputs: z.object({ cards: z.array(cardOutput) }),
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: listStripeCustomerCardsExecute,
  agent: { toolsetSlug: 'stripe.customer-cards.read' },
})
