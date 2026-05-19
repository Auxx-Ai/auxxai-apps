// src/tools/shared/encode-emoji.ts

/**
 * URL-encode an emoji for the Discord reactions endpoint. Unicode emoji are
 * percent-encoded directly; custom emoji arrive as `name:id` and are
 * encoded as-is (Discord expects the literal `name:id` substring with
 * the colon preserved by encodeURIComponent for safety).
 *
 * See plan §4.8 / §7.
 */
export function encodeEmoji(emoji: string): string {
  return encodeURIComponent(emoji)
}
