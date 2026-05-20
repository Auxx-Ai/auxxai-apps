// src/tools/telegram-block-send-location.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendLocation(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendLocation', input)
}
