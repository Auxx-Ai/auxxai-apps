// src/tools/telegram-block-unpin-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { unpinMessageInputs, unpinMessageOutputs } from './schemas/message'

type Input = z.infer<typeof unpinMessageInputs>
type Output = z.infer<typeof unpinMessageOutputs>

export default async function telegramBlockUnpinMessage(input: Input): Promise<Output> {
  return executeMessage('unpinMessage', input) as Promise<Output>
}
