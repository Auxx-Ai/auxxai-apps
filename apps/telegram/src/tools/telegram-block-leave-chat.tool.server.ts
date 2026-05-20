// src/tools/telegram-block-leave-chat.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { leaveChatInputs, leaveChatOutputs } from './schemas/chat'

type Input = z.infer<typeof leaveChatInputs>
type Output = z.infer<typeof leaveChatOutputs>

export default async function telegramBlockLeaveChat(input: Input): Promise<Output> {
  return executeChat('leave', input) as Promise<Output>
}
