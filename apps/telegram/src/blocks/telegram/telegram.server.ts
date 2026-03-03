import { VALID_OPERATIONS } from './resources/constants'
import { executeCallback } from './resources/callback/callback-execute.server'
import { executeChat } from './resources/chat/chat-execute.server'
import { executeFile } from './resources/file/file-execute.server'
import { executeMessage } from './resources/message/message-execute.server'

export default async function telegramExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'message':
      return executeMessage(operation, input)
    case 'chat':
      return executeChat(operation, input)
    case 'callback':
      return executeCallback(operation, input)
    case 'file':
      return executeFile(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
