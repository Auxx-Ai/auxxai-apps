// src/tools/telegram-block-send-document.tool.server.ts

import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'

export default async function telegramBlockSendDocument(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('sendDocument', input)
}
