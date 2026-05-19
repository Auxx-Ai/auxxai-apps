// src/tools/upload-whatsapp-media.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import uploadWhatsappMediaExecute from './upload-whatsapp-media.tool.server'

export const uploadWhatsappMediaTool = defineTool({
  id: 'upload_whatsapp_media',
  name: 'Upload WhatsApp media',
  description: 'Upload a file from a public URL into the WhatsApp media library.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z.string().min(1),
    mediaUrl: z.string().url(),
  }),
  outputs: z.object({
    mediaId: z.string(),
  }),
  config: { requiresConnection: true, timeout: 30000 },
  execute: uploadWhatsappMediaExecute,
})
