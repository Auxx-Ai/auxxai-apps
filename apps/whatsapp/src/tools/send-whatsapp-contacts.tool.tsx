// src/tools/send-whatsapp-contacts.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import sendWhatsappContactsExecute from './send-whatsapp-contacts.tool.server'

export const sendWhatsappContactsTool = defineTool({
  id: 'send_whatsapp_contacts',
  name: 'Send WhatsApp contact card',
  description: 'Send a contact card via WhatsApp Business.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z.string().min(1),
    recipientPhone: z.string().min(1),
    formattedName: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  outputs: z.object({
    messageId: z.string(),
    recipientWaId: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendWhatsappContactsExecute,
})
