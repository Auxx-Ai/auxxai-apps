// src/tools/telegram-block-answer-inline-query.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeCallback } from '../blocks/telegram/resources/callback/callback-execute.server'
import { answerInlineQueryInputs, answerInlineQueryOutputs } from './schemas/callback'

type Input = z.infer<typeof answerInlineQueryInputs>
type Output = z.infer<typeof answerInlineQueryOutputs>

export default async function telegramBlockAnswerInlineQuery(input: Input): Promise<Output> {
  return executeCallback('answerInlineQuery', input) as Promise<Output>
}
