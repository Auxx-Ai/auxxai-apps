// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a Slack user's email.
 *
 * Slack `user.id` is *not* registered against contact integrations, since
 * there's no Slack-side contact import. Instead we look up by primary
 * email via `ctx.entities.findContactByEmail`.
 *
 * Until that method ships on the SDK's entity provider, treat its absence
 * as NOT_IMPORTED (returns null). See plans/kopilot/apps/slack-overhaul.md §6.
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
    // Lookup failures don't fail the tool call; Slack-side data is still useful.
    return null
  }
}
