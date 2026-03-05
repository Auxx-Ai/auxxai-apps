// src/blocks/whatsapp/whatsapp.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeMessage } from './resources/message/message-execute.server'
import { executeMedia } from './resources/media/media-execute.server'

export default async function whatsappExecute(
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
    case 'media':
      return executeMedia(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
