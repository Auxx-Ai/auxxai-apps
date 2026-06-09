// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `findByIntegrationId` from `@auxx/sdk/server` for Shopify customer ids.
 * Returns the auxx contact recordId (`<defId>:<instId>`) or null when the
 * runtime either hasn't imported the customer or the server SDK isn't
 * available.
 *
 * See plans/kopilot/apps/shopify-overhaul.md §6 and refs.md §4.1.
 */
import { findByIntegrationId } from '@auxx/sdk/server'
import { gidToNumeric } from './map-customer'

const SOURCE = 'shopify'

export async function resolveContactRef(
  shopifyCustomerIdOrGid: string | number | null | undefined
): Promise<string | null> {
  if (!shopifyCustomerIdOrGid) return null

  const externalId =
    typeof shopifyCustomerIdOrGid === 'number'
      ? String(shopifyCustomerIdOrGid)
      : gidToNumeric(String(shopifyCustomerIdOrGid))

  try {
    const hit = await findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId,
    })
    return hit?.recordId ?? null
  } catch {
    // Treat lookup failures (incl. server SDK unavailable) as NOT_IMPORTED
    // rather than failing the whole tool call — the Shopify-side data is
    // still useful to the LLM.
    return null
  }
}
