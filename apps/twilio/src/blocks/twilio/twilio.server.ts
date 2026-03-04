// src/blocks/twilio/twilio.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeSms } from './resources/sms/sms-execute.server'
import { executeCall } from './resources/call/call-execute.server'

export default async function twilioExecute(
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'sms':
      return executeSms(operation, input)
    case 'call':
      return executeCall(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
