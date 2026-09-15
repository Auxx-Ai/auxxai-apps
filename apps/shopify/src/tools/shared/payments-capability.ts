// src/tools/shared/payments-capability.ts

import { getConnection, InsufficientPermissionsError } from '@auxx/sdk/server'
import { deriveCapabilities } from '../../blocks/shopify/resources/capabilities'

/**
 * Refuse before the first HTTP call when the token's RECORDED grant lacks
 * `read_shopify_payments_payouts`, so the platform sees "not re-consented" as a
 * permissions error with the missing capability named, not a bare 403 after a round trip.
 *
 * Only a recorded grant is judged. A connection with no `metadata.scope` (an API-Key custom
 * app, or a token minted before the platform stored the grant) may well have payments
 * access, so it is let through and Shopify's own 403 decides, as it does for every other
 * tool in this app.
 */
export function assertPaymentsReadCapability(): void {
  const scope = getConnection()?.metadata?.scope as string | undefined
  if (!scope?.trim()) return
  const { capabilities } = deriveCapabilities(scope)
  if (!capabilities.has('payments:read')) {
    throw new InsufficientPermissionsError('organization', ['read_shopify_payments_payouts'])
  }
}
