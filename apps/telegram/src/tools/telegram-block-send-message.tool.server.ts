// src/tools/telegram-block-send-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendMessageInputs, sendMessageOutputs } from './schemas/message'

type Input = z.infer<typeof sendMessageInputs>
type Output = z.infer<typeof sendMessageOutputs>

export default async function telegramBlockSendMessage(input: Input): Promise<Output> {
  return executeMessage('sendMessage', input) as Promise<Output>
}
