// src/tools/get_affirm_charge.tool.server.ts

import { getAffirmCredentials } from './shared/connection'
import { fetchCharge, projectChargeDetail } from './shared/transactions'

interface GetAffirmChargeInput {
  chargeId: string
}

export default async function getAffirmCharge(input: GetAffirmChargeInput) {
  const credentials = getAffirmCredentials()
  // `expand=checkout` is what makes `checkout.metadata.transaction_id`
  // available — the Shopify PaymentSession id, which is how an Affirm charge
  // is tied back to its order when a settlement's order_id does not match.
  // Only the metadata is projected; the rest of an expanded checkout is a real
  // customer's name, email and address.
  const charge = projectChargeDetail(await fetchCharge(credentials, input.chargeId))

  const captured = charge.events.filter((event) => event.type === 'capture').length
  const summary =
    `Affirm charge ${charge.id} for ${charge.amount} ${charge.currency}` +
    (charge.status ? `, status ${charge.status}` : '') +
    (charge.amountRefunded ? `, ${charge.amountRefunded} refunded` : '') +
    `. ${charge.events.length} event(s), ${captured} capture(s). ` +
    (charge.shopifyPaymentSessionId
      ? `Shopify payment session ${charge.shopifyPaymentSessionId}.`
      : 'Affirm reports no Shopify payment session for this charge.') +
    (charge.checkoutOrderId !== null && charge.checkoutOrderId !== charge.orderId
      ? ` NOTE: the checkout order id (${charge.checkoutOrderId}) differs from the charge order id (${charge.orderId}) — report this rather than picking one.`
      : '')

  return { summary, ...charge }
}
