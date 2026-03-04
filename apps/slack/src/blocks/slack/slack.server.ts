// src/blocks/slack/slack.server.ts

/**
 * Main server execute function for the Slack workflow block.
 * Validates resource/operation pair and dispatches to resource handlers.
 */

import { VALID_OPERATIONS } from './resources/constants'
import { executeChannel } from './resources/channel/channel-execute.server'
import { executeMessage } from './resources/message/message-execute.server'

export default async function slackExecute(
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
    case 'message':
      return executeMessage(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
