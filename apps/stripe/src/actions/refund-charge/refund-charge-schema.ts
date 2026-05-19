// actions/refund-charge/refund-charge-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const refundChargeSchema = {
  inputs: {
    chargeId: Workflow.string({
      label: 'Charge ID',
      placeholder: 'ch_... or pi_...',
      description: 'The Stripe charge or payment intent to refund',
      minLength: 1,
    }),
    amount: Workflow.currency({
      label: 'Refund Amount',
      description: 'Leave empty for a full refund. Enter amount for partial refund.',
      currencyCode: 'USD',
    }).optional(),
    reason: Workflow.select({
      label: 'Reason',
      options: [
        { value: 'requested_by_customer', label: 'Requested by customer' },
        { value: 'duplicate', label: 'Duplicate charge' },
        { value: 'fraudulent', label: 'Fraudulent' },
      ],
      default: 'requested_by_customer',
    }),
  },
  outputs: {
    refundId: Workflow.string({ label: 'Refund ID' }),
    refundedAmount: Workflow.string({ label: 'Refunded Amount (cents)' }),
    currency: Workflow.string({ label: 'Currency' }),
    status: Workflow.string({ label: 'Status' }),
    chargeId: Workflow.string({ label: 'Charge ID' }),
  },
} satisfies WorkflowSchema
