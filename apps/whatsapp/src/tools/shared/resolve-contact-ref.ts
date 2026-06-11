// src/tools/shared/resolve-contact-ref.ts

/**
 * Resolve an Auxx contact recordId from a WhatsApp phone number.
 *
 * WhatsApp `wa_id` / recipient phone numbers are *not* registered against
 * contact integrations (no WhatsApp-side contact import flow). Instead we
 * look up by primary phone via `findContactByPhone` from `@auxx/sdk/server`.
 *
 * See plans/kopilot/apps/whatsapp-overhaul.md §6.
 */
import { findContactByPhone } from '@auxx/sdk/server'

export async function resolveContactRefByPhone(
  phone: string | null | undefined
): Promise<string | null> {
  if (!phone) return null

  try {
    const hit = await findContactByPhone({ phone })
    return hit?.recordId ?? null
  } catch {
    // Lookup failures don't fail the tool call; the WhatsApp-side data is still useful.
    return null
  }
}
