// src/tools/telegram-block-send-video.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendVideo(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendVideo', input)
}
