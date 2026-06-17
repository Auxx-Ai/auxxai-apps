// src/record-actions/link-stripe-customer.server.ts

import { setFieldValues } from '@auxx/sdk/server'

/**
 * Write the chosen Stripe customer id onto the contact's app-owned,
 * connection-scoped `customerId` field. This is the value the Refund Charge
 * picker (plan 09) and every Stripe tool's reverse-resolve read back.
 */
export default async function linkStripeCustomer(
  recordId: string,
  stripeCustomerId: string
): Promise<void> {
  await setFieldValues(recordId, { customerId: stripeCustomerId })
}
