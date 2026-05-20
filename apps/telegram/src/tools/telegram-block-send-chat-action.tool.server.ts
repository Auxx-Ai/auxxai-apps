// src/tools/telegram-block-send-chat-action.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendChatAction(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendChatAction', input)
}
