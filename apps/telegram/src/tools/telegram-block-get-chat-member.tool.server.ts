// src/tools/telegram-block-get-chat-member.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { getChatMemberInputs, getChatMemberOutputs } from './schemas/chat'

type Input = z.infer<typeof getChatMemberInputs>
type Output = z.infer<typeof getChatMemberOutputs>

export default async function telegramBlockGetChatMember(input: Input): Promise<Output> {
  return executeChat('getMember', input) as Promise<Output>
}
