// src/tools/issue-stripe-refund.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import issueStripeRefundExecute from './issue-stripe-refund.tool.server'
import { refundOutput } from './get-stripe-refund.tool'

export const issueStripeRefundTool = defineTool({
  id: 'issue_stripe_refund',
  name: 'Issue Stripe refund',
  description:
    'Issue a full or partial refund against a Stripe charge. Omit amount for a full refund. Toolset selection is the approval — only enabled for agents authorized to move money.',
  icon: stripeIcon,
  inputs: z.object({
    chargeId: z
      .string()
      .describe(
        'Stripe charge id (ch_*) to refund. Use list_stripe_charges_for_customer to find it.'
      ),
    amount: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Amount to refund in the smallest currency unit (e.g. cents). Omit for full refund.'
      ),
    reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
    metadata: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  }),
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
  config: { requiresConnection: true, timeout: 20000 },
  execute: issueStripeRefundExecute,
  agent: { toolsetSlug: 'stripe.refunds.write' },
  action: {
    label: 'Refund Charge',
    description: 'Issue a full or partial refund on a Stripe charge',
    color: '#635BFF',
    surface: 'ticket-header',
    requiresConfirmation: true,
    confirmationMessage: 'Issue this refund?',
  },
})
