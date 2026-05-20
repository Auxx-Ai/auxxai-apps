// src/tools/telegram-block-send-location.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendLocationInputs, sendLocationOutputs } from './schemas/message'

type Input = z.infer<typeof sendLocationInputs>
type Output = z.infer<typeof sendLocationOutputs>

export default async function telegramBlockSendLocation(input: Input): Promise<Output> {
  return executeMessage('sendLocation', input) as Promise<Output>
}
