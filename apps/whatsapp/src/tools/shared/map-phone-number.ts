// src/tools/shared/map-phone-number.ts

/**
 * Tool-surface mapper for a WhatsApp Business phone number
 * (GET /{businessAccountId}/phone_numbers item).
 *
 * The workflow block returns flat `{label, value}` pairs for the panel
 * dropdown; the tool surface returns structured zod-shaped objects.
 */

export interface MappedWhatsappPhoneNumber {
  id: string
  displayPhoneNumber: string
  verifiedName: string
}

export function mapPhoneNumber(
  // biome-ignore lint/suspicious/noExplicitAny: Meta Graph API responses are weakly typed.
  p: any
): MappedWhatsappPhoneNumber {
  return {
    id: String(p?.id ?? ''),
    displayPhoneNumber: String(p?.display_phone_number ?? ''),
    verifiedName: String(p?.verified_name ?? ''),
  }
}
