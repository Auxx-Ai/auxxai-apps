// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * WhatsApp toolsets exposed to agents. Projected to runtime slugs as
 * `app:whatsapp:<localId>`. See plans/kopilot/apps/whatsapp-overhaul.md §5.
 *
 * v1 ships one write tool (`send_whatsapp_text`) — no template / media /
 * contact-card / location sends. Toolset enablement is the approval gate;
 * admins pick deliberately.
 *
 * `list_whatsapp_phone_numbers` is intentionally toolset-less — it
 * auto-attaches when any `whatsapp.*` toolset is enabled.
 */
export const whatsappToolsets: Toolset[] = [
  {
    id: 'whatsapp.contacts.read',
    name: 'WhatsApp contacts (read)',
    description: 'Resolve a WhatsApp phone number to an Auxx contact card.',
    tools: ['find_whatsapp_contact_by_phone'],
  },
  {
    id: 'whatsapp.media.read',
    name: 'WhatsApp media (read)',
    description: 'Download inbound media (images, video, audio, documents) by mediaId.',
    tools: ['get_whatsapp_media_url'],
  },
  {
    id: 'whatsapp.messages.write',
    name: 'WhatsApp messages (write)',
    description:
      'Send a text message from a connected WhatsApp Business sender to any recipient phone number. No template / media / contact-card sends in v1.',
    tools: ['send_whatsapp_text'],
  },
]
