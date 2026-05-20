// src/tools/telegram-block-delete-message.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockDeleteMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('deleteMessage', input)
}
