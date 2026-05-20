// src/tools/telegram-block-send-message.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendMessage', input)
}
