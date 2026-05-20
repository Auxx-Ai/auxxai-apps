// src/tools/get-stripe-account.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeAccountExecute from './get-stripe-account.tool.server'

export const getStripeAccountTool = defineTool({
  id: 'get_stripe_account',
  name: 'Get Stripe account',
  description:
    "Return the Stripe account this agent is authenticated against. Use as a preflight to know which account you're acting on (live vs test, country, default currency) before issuing refunds or cancelling subscriptions.",
  icon: stripeIcon,
  inputs: z.object({}),
  outputs: z.object({
    accountId: z.string().describe('Stripe account id (acct_*).'),
    businessName: z.string().nullable(),
    country: z.string().describe('Two-letter ISO country code.'),
    defaultCurrency: z.string().describe('Three-letter ISO currency code.'),
    livemode: z.boolean().describe('true = live Stripe account, false = test mode.'),
    email: z.string().nullable().describe('Account-level email on file with Stripe.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
    idempotent: true,
  },
  execute: getStripeAccountExecute,
  agent: {},
})
