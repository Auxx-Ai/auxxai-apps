// src/tools/telegram-block-edit-message-text.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { editMessageTextInputs, editMessageTextOutputs } from './schemas/message'

type Input = z.infer<typeof editMessageTextInputs>
type Output = z.infer<typeof editMessageTextOutputs>

export default async function telegramBlockEditMessageText(input: Input): Promise<Output> {
  return executeMessage('editMessageText', input) as Promise<Output>
}
