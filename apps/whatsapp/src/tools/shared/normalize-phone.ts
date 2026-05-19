// src/tools/shared/normalize-phone.ts

/**
 * Best-effort E.164 normalization for phone-keyed ref lookups.
 *
 * Tools ship without `libphonenumber-js` (it would balloon the bundle);
 * the API-side `find-contact-by-phone` route does the authoritative
 * E.164 parse. This client-side normalizer just strips formatting and
 * prepends `+` when missing — enough to dedupe common variants before
 * the round-trip.
 *
 *   "+1 (555) 123-4567" → "+15551234567"
 *   "15551234567"       → "+15551234567"
 *   "555-1234567"       → "+5551234567" (best effort; lookup will miss
 *                                          if the contact is stored with
 *                                          a country code)
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/[^\d]/g, '')}`
  }
  const digits = trimmed.replace(/[^\d]/g, '')
  if (!digits) return ''
  return `+${digits}`
}
