// src/tools/telegram-block-delete-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { deleteMessageInputs, deleteMessageOutputs } from './schemas/message'

type Input = z.infer<typeof deleteMessageInputs>
type Output = z.infer<typeof deleteMessageOutputs>

export default async function telegramBlockDeleteMessage(input: Input): Promise<Output> {
  return executeMessage('deleteMessage', input) as Promise<Output>
}
