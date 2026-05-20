// src/tools/telegram-block-answer-callback-query.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeCallback } from '../blocks/telegram/resources/callback/callback-execute.server'
import { answerCallbackQueryInputs, answerCallbackQueryOutputs } from './schemas/callback'

type Input = z.infer<typeof answerCallbackQueryInputs>
type Output = z.infer<typeof answerCallbackQueryOutputs>

export default async function telegramBlockAnswerCallbackQuery(input: Input): Promise<Output> {
  return executeCallback('answerQuery', input) as Promise<Output>
}
