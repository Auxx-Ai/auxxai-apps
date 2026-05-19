// src/tools/shared/parse-channel-url.ts

/**
 * Extract a Slack channel ID from a Slack URL.
 * Returns null if the URL doesn't match the expected shape.
 */
export function parseChannelIdFromUrl(url: string): string | null {
  const match = url.match(/\/([A-Z][A-Z0-9]+)\/?(?:\?.*)?$/)
  return match?.[1] ?? null
}
