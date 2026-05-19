// src/tools/shared/map-message.ts

/**
 * Tool-surface mapper for a Twilio Message resource. Returns a structured,
 * zod-typed object — separate from the workflow block's mapper which
 * stringifies fields for variable splicing. See
 * plans/kopilot/apps/twilio-overhaul.md §7.
 */

export interface MappedMessage {
  sid: string
  status: string
  direction: string
  from: string
  to: string
  body: string
  numSegments: string
  numMedia: string
  price: string | null
  priceUnit: string | null
  errorCode: string | null
  errorMessage: string | null
  dateCreated: string
  dateSent: string | null
  dateUpdated: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMessage(raw: any): MappedMessage {
  const errorCode = raw.error_code != null ? String(raw.error_code) : null
  return {
    sid: raw.sid ?? '',
    status: raw.status ?? '',
    direction: raw.direction ?? '',
    from: raw.from ?? '',
    to: raw.to ?? '',
    body: raw.body ?? '',
    numSegments: raw.num_segments ?? '',
    numMedia: raw.num_media ?? '',
    price: raw.price ?? null,
    priceUnit: raw.price_unit ?? null,
    errorCode,
    errorMessage: raw.error_message ?? null,
    dateCreated: raw.date_created ?? '',
    dateSent: raw.date_sent ?? null,
    dateUpdated: raw.date_updated ?? null,
  }
}
