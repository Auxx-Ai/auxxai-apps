import { TextBlock } from '@auxx/sdk/client'
import { telegramBlock } from './blocks/telegram/telegram.workflow'
import { updateReceivedTrigger } from './blocks/telegram/triggers/update-received/update-received.workflow'

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
    blocks: [telegramBlock],
    triggers: [updateReceivedTrigger],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Telegram</TextBlock>
      <TextBlock align="left">
        Send messages, manage chats, and interact with the Telegram Bot API. Connect your bot token
        from @BotFather to get started.
      </TextBlock>
    </>
  )
}
