// src/tools/telegram-block-get-chat-member.tool.server.ts

import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'

export default async function telegramBlockGetChatMember(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChat('getMember', input)
}
