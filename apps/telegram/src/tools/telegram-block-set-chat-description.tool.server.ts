// src/tools/telegram-block-set-chat-description.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { setChatDescriptionInputs, setChatDescriptionOutputs } from './schemas/chat'

type Input = z.infer<typeof setChatDescriptionInputs>
type Output = z.infer<typeof setChatDescriptionOutputs>

export default async function telegramBlockSetChatDescription(input: Input): Promise<Output> {
  return executeChat('setDescription', input) as Promise<Output>
}
