// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `ctx.entities.findByIntegrationId` for Stripe customer ids
 * (`cus_*`). Returns the Auxx contact recordId (`<defId>:<instId>`) or
 * null when the runtime hasn't imported the customer or hasn't shipped
 * the entities callback yet.
 *
 * Strict integrationId match per the plan's decision #5 — no
 * email-fallback fuzzy resolution. The cross-source dedupe question is
 * a separate merge surface, not tool-side magic.
 *
 * See plans/kopilot/apps/stripe-overhaul.md §6 and refs.md §4.1.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

const SOURCE = 'stripe'

export async function resolveContactRef(
  ctx: ToolExecuteContext | undefined,
  stripeCustomerId: string | null | undefined
): Promise<string | null> {
  if (!ctx || !stripeCustomerId) return null

  const entities = ctx.entities as ToolExecuteContext['entities'] | undefined
  if (!entities || typeof entities.findByIntegrationId !== 'function') return null

  try {
    const hit = await entities.findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId: stripeCustomerId,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
