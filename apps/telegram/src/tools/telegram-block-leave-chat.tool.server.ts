// src/tools/telegram-block-leave-chat.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockLeaveChat(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('leave', input)
}
