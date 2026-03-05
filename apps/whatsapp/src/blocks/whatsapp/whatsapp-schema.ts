// src/blocks/whatsapp/whatsapp-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS, RESOURCES } from './resources/constants'
import { messageComputeOutputs, messageInputs } from './resources/message/message-schema'
import { mediaComputeOutputs, mediaInputs } from './resources/media/media-schema'

export const whatsappSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'message',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: [...ALL_OPERATIONS],
      default: 'sendText',
    }),

    ...messageInputs,
    ...mediaInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    switch (resource) {
      case 'message':
        return messageComputeOutputs(operation)
      case 'media':
        return mediaComputeOutputs(operation)
      default:
        return {}
    }
  },
} satisfies WorkflowSchema
