// src/tools/telegram-block-unpin-message.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockUnpinMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('unpinMessage', input)
}
