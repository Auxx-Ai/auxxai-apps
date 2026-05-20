// src/tools/telegram-block-send-photo.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendPhoto(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendPhoto', input)
}
