// src/blocks/discord/discord-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { channelInputs, channelComputeOutputs } from './resources/channel/channel-schema'
import { messageInputs, messageComputeOutputs } from './resources/message/message-schema'
import { memberInputs, memberComputeOutputs } from './resources/member/member-schema'

export const discordSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'channel', label: 'Channel' },
        { value: 'message', label: 'Message' },
        { value: 'member', label: 'Member' },
      ],
      default: 'message',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'send',
    }),

    ...channelInputs,
    ...messageInputs,
    ...memberInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'channel') return channelComputeOutputs(operation)
    if (resource === 'message') return messageComputeOutputs(operation)
    if (resource === 'member') return memberComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
