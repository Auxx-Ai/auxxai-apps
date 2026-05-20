// src/tools/telegram-block-send-audio.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendAudioInputs, sendAudioOutputs } from './schemas/message'

type Input = z.infer<typeof sendAudioInputs>
type Output = z.infer<typeof sendAudioOutputs>

export default async function telegramBlockSendAudio(input: Input): Promise<Output> {
  return executeMessage('sendAudio', input) as Promise<Output>
}
