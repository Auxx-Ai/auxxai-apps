// src/tools/send-whatsapp-location.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import sendWhatsappLocationExecute from './send-whatsapp-location.tool.server'

export const sendWhatsappLocationTool = defineTool({
  id: 'send_whatsapp_location',
  name: 'Send WhatsApp location',
  description: 'Send a location pin via WhatsApp Business.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z.string().min(1),
    recipientPhone: z.string().min(1),
    longitude: z.string().min(1),
    latitude: z.string().min(1),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
  outputs: z.object({
    messageId: z.string(),
    recipientWaId: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendWhatsappLocationExecute,
})
