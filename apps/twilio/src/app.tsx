// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { twilioBlock } from './blocks/twilio/twilio.workflow'

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
    blocks: [twilioBlock],
    triggers: [],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Twilio</TextBlock>
      <TextBlock align="left">
        Send SMS messages and make phone calls with Twilio. Configure your Account SID in the
        Settings tab and connect your Auth Token to get started.
      </TextBlock>
    </>
  )
}
