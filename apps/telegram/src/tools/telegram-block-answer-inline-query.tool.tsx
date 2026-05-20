// src/tools/telegram-block-answer-inline-query.tool.tsx
//
// Internal-only tool — backs the Telegram block's `callback.answerInlineQuery` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { answerInlineQueryInputs, answerInlineQueryOutputs } from './schemas/callback'
import telegramBlockAnswerInlineQueryExecute from './telegram-block-answer-inline-query.tool.server'

export const telegramBlockAnswerInlineQueryTool = defineTool({
  id: 'telegram_block_answer_inline_query',
  name: 'Telegram: answer inline query (block)',
  description: 'Internal — backs the Telegram block callback.answerInlineQuery operation.',
  icon: telegramIcon,
  inputs: answerInlineQueryInputs,
  outputs: answerInlineQueryOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockAnswerInlineQueryExecute,
})
