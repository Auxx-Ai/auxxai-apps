// src/tools/send-whatsapp-text.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import sendWhatsappTextExecute from './send-whatsapp-text.tool.server'

export const sendWhatsappTextTool = defineTool({
  id: 'send_whatsapp_text',
  name: 'Send WhatsApp text message',
  description:
    'Send a text message via WhatsApp Business from a connected sender phone number to a recipient phone number. Use list_whatsapp_phone_numbers first to pick the sender.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z
      .string()
      .min(1)
      .describe('Sender phone number id from list_whatsapp_phone_numbers.'),
    recipientPhone: z
      .string()
      .min(1)
      .describe('Recipient phone number; any common format. Sanitized server-side.'),
    body: z.string().min(1).max(4096),
    previewUrl: z
      .boolean()
      .default(false)
      .describe('If true, WhatsApp renders link previews for URLs in the body.'),
  }),
  outputs: z.object({
    messageId: z.string(),
    recipientWaId: z.string(),
    normalizedPhone: z.string(),
    auxxRecordId: refs
      .entity('contact')
      .nullable()
      .describe('Auxx contact record id for the recipient, or null when no contact matches.'),
    notImportedReason: z
      .literal('NOT_IMPORTED')
      .nullable()
      .describe('Set when no Auxx contact matches the recipient phone.'),
  }),
  exampleOutput: {
    messageId: 'wamid.HBgNMTU1NTU1NTU1NTUVAgARGBI4QkE3MTRDOEY0MUFFQzYwQTYA',
    recipientWaId: '14155550132',
    normalizedPhone: '+14155550132',
    auxxRecordId: null,
    notImportedReason: null,
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendWhatsappTextExecute,
  agent: { toolsetSlug: 'whatsapp.messages.write' },
})
