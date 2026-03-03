import type { WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  WorkflowNodeText,
  useWorkflowNode,
} from '@auxx/sdk/client'
import telegramIcon from '../../assets/icon.png'
import { TelegramPanel } from './telegram-panel'
import { telegramSchema } from './telegram-schema'
import telegramExecute from './telegram.server'

export { telegramSchema }

function TelegramNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Telegram'

  if (data.resource === 'message') {
    switch (data.operation) {
      case 'sendMessage':
        label = 'Send Message'
        break
      case 'editMessageText':
        label = 'Edit Message'
        break
      case 'deleteMessage':
        label = 'Delete Message'
        break
      case 'pinMessage':
        label = 'Pin Message'
        break
      case 'unpinMessage':
        label = 'Unpin Message'
        break
      case 'sendChatAction':
        label = 'Send Chat Action'
        break
      case 'sendPhoto':
        label = 'Send Photo'
        break
      case 'sendDocument':
        label = 'Send Document'
        break
      case 'sendVideo':
        label = 'Send Video'
        break
      case 'sendAudio':
        label = 'Send Audio'
        break
      case 'sendAnimation':
        label = 'Send Animation'
        break
      case 'sendSticker':
        label = 'Send Sticker'
        break
      case 'sendLocation':
        label = 'Send Location'
        break
      case 'sendMediaGroup':
        label = 'Send Media Group'
        break
    }
  } else if (data.resource === 'chat') {
    switch (data.operation) {
      case 'get':
        label = 'Get Chat'
        break
      case 'getAdministrators':
        label = 'Get Administrators'
        break
      case 'getMember':
        label = 'Get Member'
        break
      case 'leave':
        label = 'Leave Chat'
        break
      case 'setDescription':
        label = 'Set Description'
        break
      case 'setTitle':
        label = 'Set Title'
        break
    }
  } else if (data.resource === 'callback') {
    switch (data.operation) {
      case 'answerQuery':
        label = 'Answer Callback'
        break
      case 'answerInlineQuery':
        label = 'Answer Inline Query'
        break
    }
  } else if (data.resource === 'file') {
    label = 'Get File'
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const telegramBlock = {
  id: 'telegram',
  label: 'Telegram',
  description: 'Send messages, manage chats, and interact with Telegram bots',
  category: 'action',
  icon: telegramIcon,
  color: '#0088CC',
  schema: telegramSchema,
  node: TelegramNode,
  panel: TelegramPanel,
  execute: telegramExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof telegramSchema>
