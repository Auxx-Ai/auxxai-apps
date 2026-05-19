// src/tools/create-stripe-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import createStripeCustomerExecute from './create-stripe-customer.tool.server'

const customerAddress = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().length(2).optional().describe('Two-letter ISO country code.'),
  postalCode: z.string().optional(),
})

export const createStripeCustomerTool = defineTool({
  id: 'create_stripe_customer',
  name: 'Create Stripe customer',
  description:
    'Create a new Stripe customer. At least email or name is required. Metadata is a list of key/value pairs.',
  icon: stripeIcon,
  inputs: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
      description: z.string().optional(),
      address: customerAddress.optional(),
      metadata: z
        .array(z.object({ key: z.string(), value: z.string() }))
        .optional()
        .describe('Optional KV pairs stored on the Stripe customer.'),
    })
    .refine((v) => Boolean(v.email) || Boolean(v.name), {
      message: 'Provide at least email or name.',
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
  execute: createStripeCustomerExecute,
})
