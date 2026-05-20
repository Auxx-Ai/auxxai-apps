// src/tools/telegram-block-send-document.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/telegram/resources/message/message-execute.server'
import { sendDocumentInputs, sendDocumentOutputs } from './schemas/message'

type Input = z.infer<typeof sendDocumentInputs>
type Output = z.infer<typeof sendDocumentOutputs>

export default async function telegramBlockSendDocument(input: Input): Promise<Output> {
  return executeMessage('sendDocument', input) as Promise<Output>
}
