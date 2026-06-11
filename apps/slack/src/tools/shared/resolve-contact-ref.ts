// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a Slack user's email.
 *
 * Slack `user.id` is *not* registered against contact integrations, since
 * there's no Slack-side contact import. Instead we look up by primary
 * email via `findContactByEmail` from `@auxx/sdk/server`.
 *
 * See plans/kopilot/apps/slack-overhaul.md §6.
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
    // Lookup failures don't fail the tool call; Slack-side data is still useful.
    return null
  }
}
