// src/tools/telegram-block-answer-inline-query.tool.server.ts

import { executeCallback } from '../blocks/telegram/resources/callback/callback-execute.server'

export default async function telegramBlockAnswerInlineQuery(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCallback('answerInlineQuery', input)
}
