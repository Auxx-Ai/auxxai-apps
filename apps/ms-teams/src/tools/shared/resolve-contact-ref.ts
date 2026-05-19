// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a Teams user's email.
 *
 * Teams `user.id` is *not* registered against contact integrations,
 * since there's no Teams-side contact import. Instead we look up by
 * primary email via `ctx.entities.findContactByEmail` — inherited
 * from the Slack overhaul (plans/kopilot/apps/slack-overhaul.md §6).
 *
 * Until that method ships on the SDK's entity provider, treat its
 * absence as NOT_IMPORTED (returns null).
 * See plans/kopilot/apps/ms-teams-overhaul.md §6.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

interface EmailLookupCapable {
  findContactByEmail?: (input: { email: string }) => Promise<{
    recordId: string
    displayName: string | null
  } | null>
}

export async function resolveContactRefByEmail(
  ctx: ToolExecuteContext | undefined,
  email: string | null | undefined
): Promise<string | null> {
  if (!ctx || !email) return null

  const entities = ctx.entities as (ToolExecuteContext['entities'] & EmailLookupCapable) | undefined
  if (!entities || typeof entities.findContactByEmail !== 'function') return null

  try {
    const hit = await entities.findContactByEmail({ email })
    return hit?.recordId ?? null
  } catch {
    // Lookup failures don't fail the tool call; Teams-side data is still useful.
    return null
  }
}
