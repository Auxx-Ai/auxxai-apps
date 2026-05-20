// src/tools/telegram-block-send-media-group.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendMediaGroupInputs, sendMediaGroupOutputs } from './schemas/message'

type Input = z.infer<typeof sendMediaGroupInputs>
type Output = z.infer<typeof sendMediaGroupOutputs>

export default async function telegramBlockSendMediaGroup(input: Input): Promise<Output> {
  return executeMessage('sendMediaGroup', input) as Promise<Output>
}
