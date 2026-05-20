// src/tools/get-stripe-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeCustomerExecute from './get-stripe-customer.tool.server'

export const getStripeCustomerTool = defineTool({
  id: 'get_stripe_customer',
  name: 'Get Stripe customer',
  description:
    'Fetch a Stripe customer by id (cus_*). Returns the full structured customer object plus the Auxx contact recordId when imported.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string().describe('Stripe customer id (cus_*).'),
  }),
  outputs: z.object({
    customer: z.object({
      stripeCustomerId: z.string(),
      auxxRecordId: refs.entity('contact').nullable(),
      notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
      email: z.string().nullable(),
      name: z.string().nullable(),
      phone: z.string().nullable(),
      description: z.string().nullable(),
      delinquent: z.boolean(),
      defaultSource: z.string().nullable(),
      address: z
        .object({
          line1: z.string().nullable(),
          line2: z.string().nullable(),
          city: z.string().nullable(),
          state: z.string().nullable(),
          country: z.string().nullable(),
          postalCode: z.string().nullable(),
        })
        .nullable(),
      metadata: z.record(z.string(), z.string()),
      created: z.string(),
      livemode: z.boolean(),
    }),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
    idempotent: true,
  },
  execute: getStripeCustomerExecute,
  agent: { toolsetSlug: 'stripe.customers.read' },
})
