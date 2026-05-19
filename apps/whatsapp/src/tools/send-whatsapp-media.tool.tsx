// src/tools/send-whatsapp-media.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import sendWhatsappMediaExecute from './send-whatsapp-media.tool.server'

export const sendWhatsappMediaTool = defineTool({
  id: 'send_whatsapp_media',
  name: 'Send WhatsApp media',
  description: 'Send an image, video, audio, or document message via WhatsApp Business.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z.string().min(1),
    recipientPhone: z.string().min(1),
    mediaType: z.enum(['image', 'video', 'audio', 'document']).default('image'),
    mediaUrl: z.string().url(),
    caption: z.string().optional(),
    filename: z.string().optional(),
  }),
  outputs: z.object({
    messageId: z.string(),
    recipientWaId: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendWhatsappMediaExecute,
})
