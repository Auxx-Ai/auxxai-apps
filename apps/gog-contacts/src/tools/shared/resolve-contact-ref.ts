// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `findByIntegrationId` from `@auxx/sdk/server` for Google People
 * resource names. Returns the Auxx contact recordId (`<defId>:<instId>`) or
 * null when the runtime hasn't imported the contact.
 *
 * Strict integrationId match per the plan's decision #5 — no
 * email/phone fallback. The cross-source dedupe question lives in a
 * separate merge surface, not tool-side magic.
 *
 * See plans/kopilot/apps/gog-contacts-overhaul.md §6 and refs.md §4.1.
 */
import { findByIntegrationId } from '@auxx/sdk/server'

const SOURCE = 'gog-contacts'

export async function resolveContactRef(
  resourceName: string | null | undefined
): Promise<string | null> {
  if (!resourceName) return null

  try {
    const hit = await findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId: resourceName,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
