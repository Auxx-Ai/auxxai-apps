// src/tools/telegram-block-send-sticker.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendSticker(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendSticker', input)
}
