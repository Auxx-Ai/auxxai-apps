// src/tools/telegram-block-answer-callback-query.tool.tsx
//
// Internal-only tool — backs the Telegram block's `callback.answerQuery` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockAnswerCallbackQueryExecute from './telegram-block-answer-callback-query.tool.server'

export const telegramBlockAnswerCallbackQueryTool = defineTool({
  id: 'telegram_block_answer_callback_query',
  name: 'Telegram: answer callback query (block)',
  description: 'Internal — backs the Telegram block callback.answerQuery operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      answerQueryId: z.string(),
      answerQueryText: z.string().optional(),
      answerQueryShowAlert: z.boolean().optional(),
      answerQueryUrl: z.string().optional(),
      answerQueryCacheTime: z.number().optional(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockAnswerCallbackQueryExecute,
})
