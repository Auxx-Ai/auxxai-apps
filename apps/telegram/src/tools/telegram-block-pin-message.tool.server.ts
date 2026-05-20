// src/tools/telegram-block-pin-message.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockPinMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('pinMessage', input)
}
