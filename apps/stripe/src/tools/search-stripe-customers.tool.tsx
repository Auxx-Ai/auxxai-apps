// src/tools/search-stripe-customers.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import searchStripeCustomersExecute from './search-stripe-customers.tool.server'

export const searchStripeCustomersTool = defineTool({
  id: 'search_stripe_customers',
  name: 'Search Stripe customers',
  description:
    'Search Stripe customers by email (exact) or free-text query (Stripe Search API: name, email, metadata). Provide email OR query, not both.',
  icon: stripeIcon,
  inputs: z
    .object({
      email: z.string().email().optional(),
      query: z
        .string()
        .optional()
        .describe(
          'Free-text query. Uses Stripe Search syntax against name/email/metadata. Example: \'name:"Acme"\' or \'metadata["plan"]:"pro"\'.'
        ),
      limit: z.number().int().min(1).max(100).optional().default(20),
    })
    .refine((v) => Boolean(v.email) !== Boolean(v.query), {
      message: 'Provide exactly one of email or query.',
    }),
  outputs: z.object({
    customers: z.array(
      z.object({
        stripeCustomerId: z.string(),
        auxxRecordId: refs.entity('contact').nullable(),
        notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
        email: z.string().nullable(),
        name: z.string().nullable(),
        phone: z.string().nullable(),
        delinquent: z.boolean(),
        created: z.string(),
        livemode: z.boolean(),
      })
    ),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    customers: [
      {
        stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
        auxxRecordId: null,
        email: 'jane@example.com',
        name: 'Jane Cooper',
        phone: '+14155551234',
        delinquent: false,
        created: '2026-05-12T09:00:00Z',
        livemode: true,
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
    idempotent: true,
  },
  execute: searchStripeCustomersExecute,
  agent: { toolsetSlug: 'stripe.customers.read' },
})
