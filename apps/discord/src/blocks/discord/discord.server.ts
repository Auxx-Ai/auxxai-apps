// src/blocks/discord/discord.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeChannel } from './resources/channel/channel-execute.server'
import { executeMessage } from './resources/message/message-execute.server'
import { executeMember } from './resources/member/member-execute.server'

export default async function discordExecute(
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
    case 'member':
      return executeMember(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
