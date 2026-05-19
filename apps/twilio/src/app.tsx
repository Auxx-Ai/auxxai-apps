// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { twilioBlock } from './blocks/twilio/twilio.workflow'
import { getTwilioCallTool } from './tools/get-twilio-call.tool'
import { getTwilioMessageTool } from './tools/get-twilio-message.tool'
import { listTwilioCallsTool } from './tools/list-twilio-calls.tool'
import { listTwilioMessagesTool } from './tools/list-twilio-messages.tool'
import { listTwilioPhoneNumbersTool } from './tools/list-twilio-phone-numbers.tool'
import { makeTwilioCallTool } from './tools/make-twilio-call.tool'
import { sendTwilioSmsTool } from './tools/send-twilio-sms.tool'
import { twilioToolsets } from './tools/toolsets'

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
  tools: [
    listTwilioPhoneNumbersTool,
    listTwilioMessagesTool,
    getTwilioMessageTool,
    sendTwilioSmsTool,
    listTwilioCallsTool,
    getTwilioCallTool,
    makeTwilioCallTool,
  ],
  toolsets: twilioToolsets,
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
