// src/tools/telegram-block-get-chat-administrators.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockGetChatAdministrators(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('getAdministrators', input)
}
