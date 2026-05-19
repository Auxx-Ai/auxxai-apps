// src/tools/shared/map-phone-number.ts

/**
 * Tool-surface mapper for a Twilio IncomingPhoneNumber resource. Capabilities
 * matter — the LLM must not pick a voice-only number for an SMS write. See
 * plans/kopilot/apps/twilio-overhaul.md §4.1.
 */

export interface MappedPhoneNumber {
  sid: string
  phoneNumber: string
  friendlyName: string
  capabilities: {
    sms: boolean
    mms: boolean
    voice: boolean
    fax: boolean
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPhoneNumber(raw: any): MappedPhoneNumber {
  const caps = raw.capabilities ?? {}
  return {
    sid: raw.sid ?? '',
    phoneNumber: raw.phone_number ?? '',
    friendlyName: raw.friendly_name ?? '',
    capabilities: {
      sms: Boolean(caps.sms),
      mms: Boolean(caps.mms),
      voice: Boolean(caps.voice),
      fax: Boolean(caps.fax),
    },
  }
}
