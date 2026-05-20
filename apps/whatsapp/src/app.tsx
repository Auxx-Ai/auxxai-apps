// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { whatsappBlock } from './blocks/whatsapp/whatsapp.workflow'
import { messageReceivedTrigger } from './blocks/whatsapp/triggers/message-received/message-received.workflow'
import { deleteWhatsappMediaTool } from './tools/delete-whatsapp-media.tool'
import { findWhatsappContactByPhoneTool } from './tools/find-whatsapp-contact-by-phone.tool'
import { getWhatsappMediaUrlTool } from './tools/get-whatsapp-media-url.tool'
import { listWhatsappPhoneNumbersTool } from './tools/list-whatsapp-phone-numbers.tool'
import { sendWhatsappContactsTool } from './tools/send-whatsapp-contacts.tool'
import { sendWhatsappLocationTool } from './tools/send-whatsapp-location.tool'
import { sendWhatsappMediaTool } from './tools/send-whatsapp-media.tool'
import { sendWhatsappTemplateTool } from './tools/send-whatsapp-template.tool'
import { sendWhatsappTextTool } from './tools/send-whatsapp-text.tool'
import { uploadWhatsappMediaTool } from './tools/upload-whatsapp-media.tool'
import { whatsappToolsets } from './tools/toolsets'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [whatsappBlock],
    triggers: [messageReceivedTrigger],
  },
  tools: [
    // Agent-exposed tools
    listWhatsappPhoneNumbersTool,
    findWhatsappContactByPhoneTool,
    getWhatsappMediaUrlTool,
    sendWhatsappTextTool,
    // Internal-only tools (dispatched by the whatsapp block)
    sendWhatsappMediaTool,
    sendWhatsappTemplateTool,
    sendWhatsappContactsTool,
    sendWhatsappLocationTool,
    uploadWhatsappMediaTool,
    deleteWhatsappMediaTool,
  ],
  toolsets: whatsappToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">WhatsApp</TextBlock>
      <TextBlock align="left">
        Send messages, manage media, and receive incoming messages via the WhatsApp Business API.
        Connect your Meta access token to get started.
      </TextBlock>
    </>
  )
}
