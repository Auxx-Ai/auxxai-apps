// src/tools/telegram-block-send-photo.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendPhotoInputs, sendPhotoOutputs } from './schemas/message'

type Input = z.infer<typeof sendPhotoInputs>
type Output = z.infer<typeof sendPhotoOutputs>

export default async function telegramBlockSendPhoto(input: Input): Promise<Output> {
  return executeMessage('sendPhoto', input) as Promise<Output>
}
