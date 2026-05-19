// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `ctx.entities.findByIntegrationId` for Shopify customer ids. Returns
 * the auxx contact recordId (`<defId>:<instId>`) or null when the runtime
 * either hasn't imported the customer or hasn't shipped the entities
 * callback yet.
 *
 * See plans/kopilot/apps/shopify-overhaul.md §6 and refs.md §4.1.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { gidToNumeric } from './map-customer'

const SOURCE = 'shopify'

export async function resolveContactRef(
  ctx: ToolExecuteContext | undefined,
  shopifyCustomerIdOrGid: string | number | null | undefined
): Promise<string | null> {
  if (!ctx || !shopifyCustomerIdOrGid) return null

  // Runtimes that predate the refs plumbing (`./refs.md` PR 2) will not
  // expose `ctx.entities`. Treat that as NOT_IMPORTED — the tool surface
  // still ships, refs fence rendering just no-ops until the wiring lands.
  const entities = ctx.entities as ToolExecuteContext['entities'] | undefined
  if (!entities || typeof entities.findByIntegrationId !== 'function') return null

  const externalId =
    typeof shopifyCustomerIdOrGid === 'number'
      ? String(shopifyCustomerIdOrGid)
      : gidToNumeric(String(shopifyCustomerIdOrGid))

  try {
    const hit = await entities.findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId,
    })
    return hit?.recordId ?? null
  } catch {
    // Treat lookup failures as NOT_IMPORTED rather than failing the whole
    // tool call — the Shopify-side data is still useful to the LLM.
    return null
  }
}
