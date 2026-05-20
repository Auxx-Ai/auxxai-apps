// src/tools/telegram-block-answer-inline-query.tool.tsx
//
// Internal-only tool — backs the Telegram block's `callback.answerInlineQuery` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockAnswerInlineQueryExecute from './telegram-block-answer-inline-query.tool.server'

export const telegramBlockAnswerInlineQueryTool = defineTool({
  id: 'telegram_block_answer_inline_query',
  name: 'Telegram: answer inline query (block)',
  description: 'Internal — backs the Telegram block callback.answerInlineQuery operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      answerInlineQueryId: z.string(),
      answerInlineResults: z.string(),
      answerInlineCacheTime: z.number().optional(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockAnswerInlineQueryExecute,
})
