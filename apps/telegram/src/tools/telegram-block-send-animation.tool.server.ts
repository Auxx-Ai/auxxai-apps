// src/tools/telegram-block-send-animation.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendAnimation(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendAnimation', input)
}
