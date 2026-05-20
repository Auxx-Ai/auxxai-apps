// src/tools/telegram-block-edit-message-text.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockEditMessageText(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('editMessageText', input)
}
