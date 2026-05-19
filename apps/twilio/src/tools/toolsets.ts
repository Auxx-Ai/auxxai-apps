// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Twilio toolsets exposed to agents. Read/write split on both messages and
 * calls — sending an SMS and placing a call are both billed real-world
 * actions with no take-backs. "Selection is the approval" needs the
 * granularity to allow inspect-only agents.
 *
 * `list_twilio_phone_numbers` is intentionally toolset-less — the bridge
 * auto-attaches it when any `twilio.*` toolset is enabled (same pattern as
 * `list_my_calendars` / `list_discord_guilds`).
 *
 * See plans/kopilot/apps/twilio-overhaul.md §5.
 */
export const twilioToolsets: Toolset[] = [
  {
    id: 'twilio.messages.read',
    name: 'Twilio messages (read)',
    description: 'List recent SMS/MMS messages and inspect a single message by SID.',
    tools: ['list_twilio_messages', 'get_twilio_message'],
  },
  {
    id: 'twilio.messages.write',
    name: 'Twilio messages (write)',
    description: "Send SMS messages from this org's Twilio numbers.",
    tools: ['send_twilio_sms'],
  },
  {
    id: 'twilio.calls.read',
    name: 'Twilio calls (read)',
    description: 'List recent voice calls and inspect a single call by SID.',
    tools: ['list_twilio_calls', 'get_twilio_call'],
  },
  {
    id: 'twilio.calls.write',
    name: 'Twilio calls (write)',
    description: 'Place outbound voice calls that speak a message when the recipient picks up.',
    tools: ['make_twilio_call'],
  },
]
