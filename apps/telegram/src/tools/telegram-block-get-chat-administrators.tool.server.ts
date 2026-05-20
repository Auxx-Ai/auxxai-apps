// src/tools/telegram-block-get-chat-administrators.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChat } from '../blocks/telegram/resources/chat/chat-execute.server'
import { getChatAdministratorsInputs, getChatAdministratorsOutputs } from './schemas/chat'

type Input = z.infer<typeof getChatAdministratorsInputs>
type Output = z.infer<typeof getChatAdministratorsOutputs>

export default async function telegramBlockGetChatAdministrators(
  input: Input,
): Promise<Output> {
  return executeChat('getAdministrators', input) as Promise<Output>
}
