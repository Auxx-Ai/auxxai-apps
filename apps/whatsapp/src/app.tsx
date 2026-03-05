// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { whatsappBlock } from './blocks/whatsapp/whatsapp.workflow'
import { messageReceivedTrigger } from './blocks/whatsapp/triggers/message-received/message-received.workflow'

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
