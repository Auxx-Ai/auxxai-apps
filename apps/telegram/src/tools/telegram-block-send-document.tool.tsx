// src/tools/telegram-block-send-document.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendDocument` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendDocumentInputs, sendDocumentOutputs } from './schemas/message'
import telegramBlockSendDocumentExecute from './telegram-block-send-document.tool.server'

export const telegramBlockSendDocumentTool = defineTool({
  id: 'telegram_block_send_document',
  name: 'Telegram: send document (block)',
  description: 'Internal — backs the Telegram block message.sendDocument operation.',
  icon: telegramIcon,
  inputs: sendDocumentInputs,
  outputs: sendDocumentOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendDocumentExecute,
})
