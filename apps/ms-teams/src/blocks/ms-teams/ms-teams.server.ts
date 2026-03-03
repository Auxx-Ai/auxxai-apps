// src/blocks/ms-teams/ms-teams.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeChannel } from './resources/channel/channel-execute.server'
import { executeChannelMessage } from './resources/channel-message/channel-message-execute.server'
import { executeChatMessage } from './resources/chat-message/chat-message-execute.server'
import { executeTask } from './resources/task/task-execute.server'

export default async function msTeamsExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'channel':
      return executeChannel(operation, input)
    case 'channelMessage':
      return executeChannelMessage(operation, input)
    case 'chatMessage':
      return executeChatMessage(operation, input)
    case 'task':
      return executeTask(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
