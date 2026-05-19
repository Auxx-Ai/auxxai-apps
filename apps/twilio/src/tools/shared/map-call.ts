// src/tools/shared/map-call.ts

/**
 * Tool-surface mapper for a Twilio Call resource. See
 * plans/kopilot/apps/twilio-overhaul.md §7.
 */

export interface MappedCall {
  sid: string
  status: string
  direction: string
  from: string
  to: string
  duration: string | null
  price: string | null
  priceUnit: string | null
  startTime: string | null
  endTime: string | null
  dateCreated: string
  dateUpdated: string | null
  answeredBy: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCall(raw: any): MappedCall {
  return {
    sid: raw.sid ?? '',
    status: raw.status ?? '',
    direction: raw.direction ?? '',
    from: raw.from ?? '',
    to: raw.to ?? '',
    duration: raw.duration ?? null,
    price: raw.price ?? null,
    priceUnit: raw.price_unit ?? null,
    startTime: raw.start_time ?? null,
    endTime: raw.end_time ?? null,
    dateCreated: raw.date_created ?? '',
    dateUpdated: raw.date_updated ?? null,
    answeredBy: raw.answered_by ?? null,
  }
}
