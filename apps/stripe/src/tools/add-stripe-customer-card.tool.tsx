// src/tools/add-stripe-customer-card.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import addStripeCustomerCardExecute from './add-stripe-customer-card.tool.server'
import { cardOutput } from './list-stripe-customer-cards.tool'

export const addStripeCustomerCardTool = defineTool({
  id: 'add_stripe_customer_card',
  name: 'Add Stripe customer card',
  description:
    'Attach a tokenized card to a Stripe customer. The card must already be tokenized (tok_*) — raw card details are not accepted here for PCI compliance.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    token: z
      .string()
      .describe('A Stripe card token (tok_*) obtained via Stripe.js or a test token.'),
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
      isDefault: false,
    },
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: addStripeCustomerCardExecute,
  agent: { toolsetSlug: 'stripe.customer-cards.write' },
})
