// src/tools/telegram-block-send-animation.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendAnimationInputs, sendAnimationOutputs } from './schemas/message'

type Input = z.infer<typeof sendAnimationInputs>
type Output = z.infer<typeof sendAnimationOutputs>

export default async function telegramBlockSendAnimation(input: Input): Promise<Output> {
  return executeMessage('sendAnimation', input) as Promise<Output>
}
