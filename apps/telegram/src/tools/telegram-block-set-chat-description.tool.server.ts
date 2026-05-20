// src/tools/telegram-block-set-chat-description.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockSetChatDescription(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('setDescription', input)
}
