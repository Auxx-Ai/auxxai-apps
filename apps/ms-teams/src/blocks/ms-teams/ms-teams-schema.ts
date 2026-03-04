// src/blocks/ms-teams/ms-teams-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { RESOURCES, ALL_OPERATIONS } from './resources/constants'
import { channelInputs, channelComputeOutputs } from './resources/channel/channel-schema'
import {
  channelMessageInputs,
  channelMessageComputeOutputs,
} from './resources/channel-message/channel-message-schema'
import {
  chatMessageInputs,
  chatMessageComputeOutputs,
} from './resources/chat-message/chat-message-schema'
import { taskInputs, taskComputeOutputs } from './resources/task/task-schema'

export const msTeamsSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: RESOURCES as any,
      default: 'channel',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),

    ...channelInputs,
    ...channelMessageInputs,
    ...chatMessageInputs,
    ...taskInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'channel') return channelComputeOutputs(operation)
    if (resource === 'channelMessage') return channelMessageComputeOutputs(operation)
    if (resource === 'chatMessage') return chatMessageComputeOutputs(operation)
    if (resource === 'task') return taskComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
