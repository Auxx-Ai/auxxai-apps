// actions/refund-charge/refund-charge.action.ts

import type { QuickAction } from '@auxx/sdk'
import { refundChargeSchema } from './refund-charge-schema'
import refundChargeExecute from './refund-charge.server'

export const refundChargeAction = {
  id: 'refund-charge',
  label: 'Refund Charge',
  description: 'Issue a full or partial refund on a Stripe charge',
  color: '#635BFF',
  schema: refundChargeSchema,
  execute: refundChargeExecute,
  config: {
    timeout: 15000,
    requiresConnection: true,
    requiresConfirmation: true,
    confirmationMessage: 'Issue this refund?',
  },
} satisfies QuickAction<typeof refundChargeSchema>
