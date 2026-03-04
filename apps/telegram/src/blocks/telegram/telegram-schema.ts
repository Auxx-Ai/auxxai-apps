import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS, RESOURCES } from './resources/constants'
import { callbackComputeOutputs, callbackInputs } from './resources/callback/callback-schema'
import { chatComputeOutputs, chatInputs } from './resources/chat/chat-schema'
import { fileComputeOutputs, fileInputs } from './resources/file/file-schema'
import { messageComputeOutputs, messageInputs } from './resources/message/message-schema'

export const telegramSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'message',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: [...ALL_OPERATIONS],
      default: 'sendMessage',
    }),

    ...messageInputs,
    ...chatInputs,
    ...callbackInputs,
    ...fileInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    switch (resource) {
      case 'message':
        return messageComputeOutputs(operation)
      case 'chat':
        return chatComputeOutputs(operation)
      case 'callback':
        return callbackComputeOutputs(operation)
      case 'file':
        return fileComputeOutputs(operation)
      default:
        return {}
    }
  },
} satisfies WorkflowSchema
