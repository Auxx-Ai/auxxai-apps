// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a Teams user's email.
 *
 * Teams `user.id` is *not* registered against contact integrations,
 * since there's no Teams-side contact import. Instead we look up by
 * primary email via `findContactByEmail` from `@auxx/sdk/server` —
 * inherited from the Slack overhaul (plans/kopilot/apps/slack-overhaul.md §6).
 *
 * See plans/kopilot/apps/ms-teams-overhaul.md §6.
 */
import { findContactByEmail } from '@auxx/sdk/server'

export async function resolveContactRefByEmail(
  email: string | null | undefined
): Promise<string | null> {
  if (!email) return null

  try {
    const hit = await findContactByEmail({ email })
    return hit?.recordId ?? null
  } catch {
    // Lookup failures don't fail the tool call; Teams-side data is still useful.
    return null
  }
}
