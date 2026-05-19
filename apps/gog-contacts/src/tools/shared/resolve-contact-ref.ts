// src/tools/shared/resolve-contact-ref.ts

/**
 * Wraps `ctx.entities.findByIntegrationId` for Google People resource
 * names. Returns the Auxx contact recordId (`<defId>:<instId>`) or null
 * when the runtime hasn't imported the contact or hasn't shipped the
 * entities callback yet.
 *
 * Strict integrationId match per the plan's decision #5 — no
 * email/phone fallback. The cross-source dedupe question lives in a
 * separate merge surface, not tool-side magic.
 *
 * See plans/kopilot/apps/gog-contacts-overhaul.md §6 and refs.md §4.1.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

const SOURCE = 'gog-contacts'

export async function resolveContactRef(
  ctx: ToolExecuteContext | undefined,
  resourceName: string | null | undefined
): Promise<string | null> {
  if (!ctx || !resourceName) return null

  // Runtimes that predate the refs plumbing (refs.md PR 2) won't expose
  // `ctx.entities`. Treat that as NOT_IMPORTED — the tool surface still
  // ships; the auxx-entity-card fence just no-ops until wiring lands.
  const entities = ctx.entities as ToolExecuteContext['entities'] | undefined
  if (!entities || typeof entities.findByIntegrationId !== 'function') return null

  try {
    const hit = await entities.findByIntegrationId({
      kind: 'contact',
      source: SOURCE,
      externalId: resourceName,
    })
    return hit?.recordId ?? null
  } catch {
    return null
  }
}
