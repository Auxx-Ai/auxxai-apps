// src/tools/get-stripe-refund.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeRefundExecute from './get-stripe-refund.tool.server'

export const refundOutput = z.object({
  refundId: z.string(),
  chargeId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['succeeded', 'pending', 'failed', 'canceled']),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).nullable(),
  customer: z.object({
    stripeCustomerId: z.string().nullable(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  created: z.string(),
})

export const getStripeRefundTool = defineTool({
  id: 'get_stripe_refund',
  name: 'Get Stripe refund',
  description:
    'Fetch a Stripe refund by id (re_*). The customer ref is resolved from the parent charge.',
  icon: stripeIcon,
  inputs: z.object({ refundId: z.string().describe('Stripe refund id (re_*).') }),
  outputs: z.object({ refund: refundOutput }),
  exampleOutput: {
    refund: {
      refundId: 're_1MrabC2eZvKYlo2C',
      chargeId: 'ch_3MrabC2eZvKYlo2C1',
      amount: 2400,
      currency: 'usd',
      status: 'succeeded',
      reason: 'requested_by_customer',
      customer: {
        stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
        auxxRecordId: null,
      },
      created: '2026-06-02T10:15:00Z',
    },
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeRefundExecute,
  agent: { toolsetSlug: 'stripe.refunds.read' },
})
