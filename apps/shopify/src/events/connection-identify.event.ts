// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'
import { getShopDomain } from '../blocks/shopify/shared/shopify-api'

/**
 * Pure pre-insert identity hook. Shopify carries the shop subdomain on the
 * connection metadata (`metadata.connectionVariables.shop`) from the install
 * flow, so `getShopDomain` derives the full `xxx.myshopify.com` domain with no
 * API call or side effects. Returning the shop domain lets the platform dedupe
 * re-connects of the same store in place.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  const shopDomain = getShopDomain(connection.metadata)
  return shopDomain ? { identifier: shopDomain } : {}
}
