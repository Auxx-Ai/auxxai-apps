import { TextBlock } from '@auxx/sdk/client'
import { telegramBlock } from './blocks/telegram/telegram.workflow'

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
    triggers: [],
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
