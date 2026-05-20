// src/tools/telegram-block-send-media-group.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendMediaGroup(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendMediaGroup', input)
}
