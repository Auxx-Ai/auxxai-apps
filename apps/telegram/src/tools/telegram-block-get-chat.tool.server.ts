// src/tools/telegram-block-get-chat.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockGetChat(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('get', input)
}
