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
  exampleOutput: {
    mediaId: '1234567890123456',
    url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1234567890123456&ext=1717840800&hash=ATtEXAMPLEhashValue',
    mimeType: 'image/jpeg',
    fileSize: 184523,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getWhatsappMediaUrlExecute,
  agent: { toolsetSlug: 'whatsapp.media.read' },
})
