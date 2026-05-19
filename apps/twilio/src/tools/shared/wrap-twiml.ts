// src/tools/shared/wrap-twiml.ts

/**
 * Wrap plain spoken text in a minimal TwiML document with XML-escaped
 * content. The tool surface never accepts raw TwiML — see
 * plans/kopilot/apps/twilio-overhaul.md §3 row 8.
 */
export function wrapTwiml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
  return `<Response><Say>${escaped}</Say></Response>`
}
