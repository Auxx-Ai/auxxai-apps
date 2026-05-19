import { TextBlock } from '@auxx/sdk/client'
import { telegramBlock } from './blocks/telegram/telegram.workflow'
import { updateReceivedTrigger } from './blocks/telegram/triggers/update-received/update-received.workflow'
import { deleteTelegramMessageTool } from './tools/delete-telegram-message.tool'
import { editTelegramMessageTool } from './tools/edit-telegram-message.tool'
import { getTelegramChatTool } from './tools/get-telegram-chat.tool'
import { getTelegramChatAdministratorsTool } from './tools/get-telegram-chat-administrators.tool'
import { getTelegramChatMemberTool } from './tools/get-telegram-chat-member.tool'
import { getTelegramFileTool } from './tools/get-telegram-file.tool'
import { replyToTelegramMessageTool } from './tools/reply-to-telegram-message.tool'
import { sendTelegramMessageTool } from './tools/send-telegram-message.tool'
import { telegramToolsets } from './tools/toolsets'

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
  tools: [
    getTelegramChatTool,
    getTelegramChatAdministratorsTool,
    getTelegramChatMemberTool,
    getTelegramFileTool,
    sendTelegramMessageTool,
    replyToTelegramMessageTool,
    editTelegramMessageTool,
    deleteTelegramMessageTool,
  ],
  toolsets: telegramToolsets,
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
