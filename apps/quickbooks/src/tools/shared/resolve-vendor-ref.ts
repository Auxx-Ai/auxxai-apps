// src/tools/shared/resolve-vendor-ref.ts

/**
 * Vendor → `company` ref resolver. Unlike Customer, Vendor does not
 * fork — it's an org-level entity by definition (the business you
 * pay), so only the `company` EntityKind applies.
 *
 * See plans/kopilot/apps/quickbooks-overhaul.md §6.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

const SOURCE = 'quickbooks'

export async function resolveVendorRef(
  ctx: ToolExecuteContext | undefined,
  vendorId: string | null | undefined
): Promise<string | null> {
  if (!ctx || !vendorId) return null

  const entities = ctx.entities as ToolExecuteContext['entities'] | undefined
  if (!entities || typeof entities.findByIntegrationId !== 'function') return null

  try {
    const hit = await entities.findByIntegrationId({
      kind: 'company',
      source: SOURCE,
      externalId: vendorId,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
