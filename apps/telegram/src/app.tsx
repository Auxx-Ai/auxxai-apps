// src/app.tsx

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
import { telegramBlockAnswerCallbackQueryTool } from './tools/telegram-block-answer-callback-query.tool'
import { telegramBlockAnswerInlineQueryTool } from './tools/telegram-block-answer-inline-query.tool'
import { telegramBlockDeleteMessageTool } from './tools/telegram-block-delete-message.tool'
import { telegramBlockEditMessageTextTool } from './tools/telegram-block-edit-message-text.tool'
import { telegramBlockGetChatTool } from './tools/telegram-block-get-chat.tool'
import { telegramBlockGetChatAdministratorsTool } from './tools/telegram-block-get-chat-administrators.tool'
import { telegramBlockGetChatMemberTool } from './tools/telegram-block-get-chat-member.tool'
import { telegramBlockGetFileTool } from './tools/telegram-block-get-file.tool'
import { telegramBlockLeaveChatTool } from './tools/telegram-block-leave-chat.tool'
import { telegramBlockPinMessageTool } from './tools/telegram-block-pin-message.tool'
import { telegramBlockSendAnimationTool } from './tools/telegram-block-send-animation.tool'
import { telegramBlockSendAudioTool } from './tools/telegram-block-send-audio.tool'
import { telegramBlockSendChatActionTool } from './tools/telegram-block-send-chat-action.tool'
import { telegramBlockSendDocumentTool } from './tools/telegram-block-send-document.tool'
import { telegramBlockSendLocationTool } from './tools/telegram-block-send-location.tool'
import { telegramBlockSendMediaGroupTool } from './tools/telegram-block-send-media-group.tool'
import { telegramBlockSendMessageTool } from './tools/telegram-block-send-message.tool'
import { telegramBlockSendPhotoTool } from './tools/telegram-block-send-photo.tool'
import { telegramBlockSendStickerTool } from './tools/telegram-block-send-sticker.tool'
import { telegramBlockSendVideoTool } from './tools/telegram-block-send-video.tool'
import { telegramBlockSetChatDescriptionTool } from './tools/telegram-block-set-chat-description.tool'
import { telegramBlockSetChatTitleTool } from './tools/telegram-block-set-chat-title.tool'
import { telegramBlockUnpinMessageTool } from './tools/telegram-block-unpin-message.tool'
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
    // Internal tools — back the Telegram block's dispatcher, no agent/action surface.
    telegramBlockSendMessageTool,
    telegramBlockEditMessageTextTool,
    telegramBlockDeleteMessageTool,
    telegramBlockPinMessageTool,
    telegramBlockUnpinMessageTool,
    telegramBlockSendChatActionTool,
    telegramBlockSendPhotoTool,
    telegramBlockSendDocumentTool,
    telegramBlockSendVideoTool,
    telegramBlockSendAudioTool,
    telegramBlockSendAnimationTool,
    telegramBlockSendStickerTool,
    telegramBlockSendLocationTool,
    telegramBlockSendMediaGroupTool,
    telegramBlockGetChatTool,
    telegramBlockGetChatAdministratorsTool,
    telegramBlockGetChatMemberTool,
    telegramBlockLeaveChatTool,
    telegramBlockSetChatDescriptionTool,
    telegramBlockSetChatTitleTool,
    telegramBlockAnswerCallbackQueryTool,
    telegramBlockAnswerInlineQueryTool,
    telegramBlockGetFileTool,
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
