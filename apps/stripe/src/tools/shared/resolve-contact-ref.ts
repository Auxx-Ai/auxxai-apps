// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `findByIntegrationId` from `@auxx/sdk/server` for Stripe customer ids
 * (`cus_*`). Returns the Auxx contact recordId (`<defId>:<instId>`) or null
 * when the runtime hasn't imported the customer.
 *
 * Strict integrationId match per the plan's decision #5 — no
 * email-fallback fuzzy resolution. The cross-source dedupe question is
 * a separate merge surface, not tool-side magic.
 *
 * See plans/kopilot/apps/stripe-overhaul.md §6 and refs.md §4.1.
 */
import { findByIntegrationId } from '@auxx/sdk/server'

const SOURCE = 'stripe'

export async function resolveContactRef(
  stripeCustomerId: string | null | undefined
): Promise<string | null> {
  if (!stripeCustomerId) return null

  try {
    const hit = await findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId: stripeCustomerId,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
