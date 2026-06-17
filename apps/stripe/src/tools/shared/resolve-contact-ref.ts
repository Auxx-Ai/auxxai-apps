// src/tools/shared/resolve-contact-ref.ts

/**
 * Reverse-resolves a Stripe customer id (`cus_*`) to the Auxx contact recordId
 * (`<defId>:<instId>`), or null when no contact is linked to it.
 *
 * The link is the contact's app-owned `customerId` field — the single source of
 * truth written by the "Link Stripe customer" record action (plan 10). We look
 * up by that field rather than `findByIntegrationId`, because the
 * integration-id mapping is never written for Stripe (no writer;
 * `EntityInstance.integrationSource` is a single slot that may already be
 * `'shopify'`). `findRecordByFieldValue` scopes to the bound Stripe connection
 * for connection-scoped fields, so the lookup matches the same account that
 * wrote the value.
 *
 * See plans/actions/10-link-contact-to-stripe.md §6.
 */
import { findRecordByFieldValue } from '@auxx/sdk/server'

export async function resolveContactRef(
  stripeCustomerId: string | null | undefined
): Promise<string | null> {
  if (!stripeCustomerId) return null

  try {
    const hit = await findRecordByFieldValue({
      targetEntity: 'contact',
      fieldKey: 'customerId',
      value: stripeCustomerId,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
