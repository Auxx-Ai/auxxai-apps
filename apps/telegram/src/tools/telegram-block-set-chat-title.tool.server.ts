// src/tools/telegram-block-set-chat-title.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockSetChatTitle(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('setTitle', input)
}
