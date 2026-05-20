// src/tools/update-stripe-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import updateStripeCustomerExecute from './update-stripe-customer.tool.server'

const customerAddress = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().length(2).optional(),
  postalCode: z.string().optional(),
})

export const updateStripeCustomerTool = defineTool({
  id: 'update_stripe_customer',
  name: 'Update Stripe customer',
  description:
    'Update an existing Stripe customer. Only the provided fields are changed; omitted fields stay as-is.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    address: customerAddress.optional(),
    metadata: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
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
      created: z.string(),
      livemode: z.boolean(),
    }),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: updateStripeCustomerExecute,
  agent: { toolsetSlug: 'stripe.customers.write' },
})
