// src/tools/get-whatsapp-media-url.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import getWhatsappMediaUrlExecute from './get-whatsapp-media-url.tool.server'

export const getWhatsappMediaUrlTool = defineTool({
  id: 'get_whatsapp_media_url',
  name: 'Get WhatsApp media URL',
  description:
    'Resolve a WhatsApp mediaId (from an inbound message trigger) to a short-lived signed download URL plus mime/size metadata. The URL expires in ~5 minutes and requires the same Bearer token to download — pass it to a tool that can authenticate, not to the user as a link.',
  icon: whatsappIcon,
  inputs: z.object({
    mediaId: z.string().min(1),
  }),
  outputs: z.object({
    mediaId: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    fileSize: z.number().int(),
    sha256: z.string(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: getWhatsappMediaUrlExecute,
})
