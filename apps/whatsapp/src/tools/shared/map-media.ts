// src/tools/shared/map-media.ts

/**
 * Tool-surface mapper for a WhatsApp media object
 * (GET /{mediaId} response).
 *
 * The signed `url` is short-lived (~5 minutes) and requires the same
 * Bearer token to download — the LLM should pass it to a tool that can
 * authenticate, not back to the user as a link.
 */

export interface MappedWhatsappMedia {
  mediaId: string
  url: string
  mimeType: string
  fileSize: number
  sha256: string
}

export function mapMedia(
  // biome-ignore lint/suspicious/noExplicitAny: Meta Graph API responses are weakly typed.
  m: any
): MappedWhatsappMedia {
  return {
    mediaId: String(m?.id ?? ''),
    url: String(m?.url ?? ''),
    mimeType: String(m?.mime_type ?? ''),
    fileSize: Number(m?.file_size ?? 0),
    sha256: String(m?.sha256 ?? ''),
  }
}
