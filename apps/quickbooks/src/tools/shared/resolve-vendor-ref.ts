// src/tools/shared/resolve-vendor-ref.ts

/**
 * Vendor → `company` ref resolver. Unlike Customer, Vendor does not
 * fork — it's an org-level entity by definition (the business you
 * pay), so only the `company` EntityKind applies.
 *
 * See plans/kopilot/apps/quickbooks-overhaul.md §6.
 */
import { findByIntegrationId } from '@auxx/sdk/server'

const SOURCE = 'quickbooks'

export async function resolveVendorRef(
  vendorId: string | null | undefined
): Promise<string | null> {
  if (!vendorId) return null

  try {
    const hit = await findByIntegrationId({
      kind: 'company',
      source: SOURCE,
      externalId: vendorId,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
