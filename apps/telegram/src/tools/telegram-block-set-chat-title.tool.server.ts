// src/tools/telegram-block-set-chat-title.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { setChatTitleInputs, setChatTitleOutputs } from './schemas/chat'

type Input = z.infer<typeof setChatTitleInputs>
type Output = z.infer<typeof setChatTitleOutputs>

export default async function telegramBlockSetChatTitle(input: Input): Promise<Output> {
  return executeChat('setTitle', input) as Promise<Output>
}
