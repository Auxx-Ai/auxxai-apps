// src/tools/telegram-block-send-audio.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendAudio(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendAudio', input)
}
