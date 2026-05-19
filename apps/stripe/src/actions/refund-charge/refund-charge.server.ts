// actions/refund-charge/refund-charge.server.ts

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../blocks/stripe/shared/stripe-api'
import type { refundChargeSchema } from './refund-charge-schema'

const refundChargeExecute: WorkflowExecuteFunction<typeof refundChargeSchema> = async (input) => {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  if (!input.chargeId || typeof input.chargeId !== 'string') {
    throw new Error('Charge ID is required')
  }

  const body: Record<string, any> = {}

  // Stripe accepts either charge or payment_intent
  if (input.chargeId.startsWith('pi_')) {
    body.payment_intent = input.chargeId
  } else {
    body.charge = input.chargeId
  }

  if (input.amount) {
    body.amount = input.amount
  }

  if (input.reason) {
    body.reason = input.reason
  }

  const result = await stripeApi<any>('POST', '/refunds', apiKey, { body })

  return {
    refundId: result.id,
    refundedAmount: String(result.amount),
    currency: result.currency,
    status: result.status,
    chargeId: result.charge ?? '',
  }
}

export default refundChargeExecute
