// src/tools/telegram-block-get-chat.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { getChatInputs, getChatOutputs } from './schemas/chat'

type Input = z.infer<typeof getChatInputs>
type Output = z.infer<typeof getChatOutputs>

export default async function telegramBlockGetChat(input: Input): Promise<Output> {
  return executeChat('get', input) as Promise<Output>
}
