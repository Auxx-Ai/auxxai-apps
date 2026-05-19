// src/tools/shared/sanitize-phone.ts

/**
 * Strip non-digit phone formatting before sending to Meta's
 * `messages` endpoint. Meta expects digits-only (no `+`, no spaces).
 *
 * Promoted from the workflow block's message-execute.server.ts so the
 * tool surface and workflow surface stay in sync.
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[-() +]/g, '')
}
