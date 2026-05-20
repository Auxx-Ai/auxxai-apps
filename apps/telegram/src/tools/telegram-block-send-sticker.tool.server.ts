// src/tools/telegram-block-send-sticker.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendStickerInputs, sendStickerOutputs } from './schemas/message'

type Input = z.infer<typeof sendStickerInputs>
type Output = z.infer<typeof sendStickerOutputs>

export default async function telegramBlockSendSticker(input: Input): Promise<Output> {
  return executeMessage('sendSticker', input) as Promise<Output>
}
