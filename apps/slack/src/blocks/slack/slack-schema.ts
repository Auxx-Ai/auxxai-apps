// src/blocks/slack/slack-schema.ts

/**
 * Assembled schema for the Slack workflow block.
 * Combines all resource inputs and computes outputs based on resource/operation.
 *
 * Extracted to its own file to avoid circular dependency between
 * slack.workflow.tsx (block export) and slack-panel.tsx (panel component).
 */

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { channelInputs, channelComputeOutputs } from './resources/channel/channel-schema'
import { messageInputs, messageComputeOutputs, messageSendDynamicOutputs } from './resources/message/message-schema'

export const slackSchema = {
  inputs: {
    // Top-level selectors
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'channel', label: 'Channel' },
        { value: 'message', label: 'Message' },
      ],
      default: 'message',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'send',
    }),

    // Spread all resource inputs
    ...channelInputs,
    ...messageInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'channel') return channelComputeOutputs(operation)
    if (resource === 'message') {
      const baseOutputs = messageComputeOutputs(operation)
      if (operation === 'send') {
        return { ...baseOutputs, ...messageSendDynamicOutputs(inputs.sendTo) }
      }
      return baseOutputs
    }
    return {}
  },
} satisfies WorkflowSchema
