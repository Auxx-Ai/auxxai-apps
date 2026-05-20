// src/tools/telegram-block-pin-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { pinMessageInputs, pinMessageOutputs } from './schemas/message'

type Input = z.infer<typeof pinMessageInputs>
type Output = z.infer<typeof pinMessageOutputs>

export default async function telegramBlockPinMessage(input: Input): Promise<Output> {
  return executeMessage('pinMessage', input) as Promise<Output>
}
