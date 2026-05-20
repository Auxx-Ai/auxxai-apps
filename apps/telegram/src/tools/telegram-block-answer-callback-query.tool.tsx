// src/tools/telegram-block-answer-callback-query.tool.tsx
//
// Internal-only tool — backs the Telegram block's `callback.answerQuery` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { answerCallbackQueryInputs, answerCallbackQueryOutputs } from './schemas/callback'
import telegramBlockAnswerCallbackQueryExecute from './telegram-block-answer-callback-query.tool.server'

export const telegramBlockAnswerCallbackQueryTool = defineTool({
  id: 'telegram_block_answer_callback_query',
  name: 'Telegram: answer callback query (block)',
  description: 'Internal — backs the Telegram block callback.answerQuery operation.',
  icon: telegramIcon,
  inputs: answerCallbackQueryInputs,
  outputs: answerCallbackQueryOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockAnswerCallbackQueryExecute,
})
