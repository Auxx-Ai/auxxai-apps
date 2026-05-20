// src/tools/telegram-block-send-video.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendVideoInputs, sendVideoOutputs } from './schemas/message'

type Input = z.infer<typeof sendVideoInputs>
type Output = z.infer<typeof sendVideoOutputs>

export default async function telegramBlockSendVideo(input: Input): Promise<Output> {
  return executeMessage('sendVideo', input) as Promise<Output>
}
