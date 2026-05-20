// src/tools/telegram-block-send-chat-action.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendChatActionInputs, sendChatActionOutputs } from './schemas/message'

type Input = z.infer<typeof sendChatActionInputs>
type Output = z.infer<typeof sendChatActionOutputs>

export default async function telegramBlockSendChatAction(input: Input): Promise<Output> {
  return executeMessage('sendChatAction', input) as Promise<Output>
}
