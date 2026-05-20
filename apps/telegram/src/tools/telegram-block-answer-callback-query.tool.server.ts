// src/tools/telegram-block-answer-callback-query.tool.server.ts

import { executeCallback } from '../blocks/telegram/resources/callback/callback-execute.server'

export default async function telegramBlockAnswerCallbackQuery(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCallback('answerQuery', input)
}
