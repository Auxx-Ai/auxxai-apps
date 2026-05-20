// src/tools/delete-whatsapp-media.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import deleteWhatsappMediaExecute from './delete-whatsapp-media.tool.server'

export const deleteWhatsappMediaTool = defineTool({
  id: 'delete_whatsapp_media',
  name: 'Delete WhatsApp media',
  description: 'Delete a media object from WhatsApp by mediaId.',
  icon: whatsappIcon,
  inputs: z.object({
    mediaId: z.string().min(1),
  }),
  outputs: z.object({
    success: z.boolean(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: deleteWhatsappMediaExecute,
})
