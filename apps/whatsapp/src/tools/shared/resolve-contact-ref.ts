// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a WhatsApp phone number.
 *
 * WhatsApp `wa_id` / recipient phone numbers are *not* registered against
 * contact integrations (no WhatsApp-side contact import flow). Instead we
 * look up by primary phone via `ctx.entities.findContactByPhone`.
 *
 * Until that method ships on the SDK's entity provider, treat its absence
 * as NOT_IMPORTED (returns null). See plans/kopilot/apps/whatsapp-overhaul.md §6.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

interface PhoneLookupCapable {
  findContactByPhone?: (input: { phone: string }) => Promise<{
    recordId: string
    displayName: string | null
  } | null>
}

export async function resolveContactRefByPhone(
  ctx: ToolExecuteContext | undefined,
  phone: string | null | undefined
): Promise<string | null> {
  if (!ctx || !phone) return null

  const entities = ctx.entities as (ToolExecuteContext['entities'] & PhoneLookupCapable) | undefined
  if (!entities || typeof entities.findContactByPhone !== 'function') return null

  try {
    const hit = await entities.findContactByPhone({ phone })
    return hit?.recordId ?? null
  } catch {
    // Lookup failures don't fail the tool call; the WhatsApp-side data is still useful.
    return null
  }
}
