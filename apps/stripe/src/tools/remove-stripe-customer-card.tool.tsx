// src/tools/remove-stripe-customer-card.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import removeStripeCustomerCardExecute from './remove-stripe-customer-card.tool.server'

export const removeStripeCustomerCardTool = defineTool({
  id: 'remove_stripe_customer_card',
  name: 'Remove Stripe customer card',
  description:
    'Detach a card from a Stripe customer. Selection is the approval — payment-method changes can break recurring revenue.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    cardId: z.string(),
  }),
  outputs: z.object({
    cardId: z.string(),
    deleted: z.boolean(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: removeStripeCustomerCardExecute,
})
