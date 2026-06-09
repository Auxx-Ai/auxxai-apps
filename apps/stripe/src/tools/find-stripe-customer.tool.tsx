// src/tools/find-stripe-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import findStripeCustomerExecute from './find-stripe-customer.tool.server'

export const findStripeCustomerTool = defineTool({
  id: 'find_stripe_customer',
  name: 'Find Stripe customer',
  description:
    'Look up a single Stripe customer by exact email. Returns the most recently created match plus the Auxx contact recordId when the customer has been imported. Use search_stripe_customers if you need all matches or a free-text query.',
  icon: stripeIcon,
  inputs: z.object({
    email: z.string().email().describe('Customer email. Server-side exact match.'),
  }),
  outputs: z.object({
    customer: z
      .object({
        stripeCustomerId: z
          .string()
          .describe('Stripe customer id (cus_*). Pass this to other Stripe tools.'),
        auxxRecordId: refs
          .entity('contact')
          .nullable()
          .describe(
            'Auxx contact recordId, or null when this Stripe customer has not been imported as a contact. Use in `auxx:entity-card` fences.'
          ),
        notImportedReason: z
          .enum(['NOT_IMPORTED'])
          .optional()
          .describe('Set when the Stripe customer exists but has no Auxx contact record.'),
        email: z.string().nullable(),
        name: z.string().nullable(),
        phone: z.string().nullable(),
        description: z.string().nullable(),
        delinquent: z.boolean().describe('true if the customer has unpaid invoices.'),
        created: z.string().describe('ISO 8601.'),
        livemode: z.boolean(),
      })
      .nullable()
      .describe('null when no Stripe customer matches the email.'),
  }),
  exampleOutput: {
    customer: {
      stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
      auxxRecordId: null,
      email: 'jane@example.com',
      name: 'Jane Cooper',
      phone: '+14155551234',
      description: null,
      delinquent: false,
      created: '2026-05-12T09:00:00Z',
      livemode: true,
    },
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
    idempotent: true,
  },
  execute: findStripeCustomerExecute,
  agent: { toolsetSlug: 'stripe.customers.read' },
})
