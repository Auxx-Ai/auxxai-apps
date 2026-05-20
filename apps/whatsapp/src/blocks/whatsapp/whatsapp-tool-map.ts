// src/blocks/whatsapp/whatsapp-tool-map.ts

/**
 * `<resource>.<operation>` → tool id dispatch table for the WhatsApp
 * block. Lives in its own file so the server dispatcher can import it
 * without pulling in the workflow.tsx node/panel React graph.
 */
export const whatsappBlockToolMap = {
  'message.sendText': 'send_whatsapp_text',
  'message.sendMedia': 'send_whatsapp_media',
  'message.sendTemplate': 'send_whatsapp_template',
  'message.sendContacts': 'send_whatsapp_contacts',
  'message.sendLocation': 'send_whatsapp_location',
  'media.upload': 'upload_whatsapp_media',
  'media.getUrl': 'get_whatsapp_media_url',
  'media.delete': 'delete_whatsapp_media',
} as const
