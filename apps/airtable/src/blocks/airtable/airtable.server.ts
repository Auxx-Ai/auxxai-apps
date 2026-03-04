// src/blocks/airtable/airtable.server.ts

/**
 * Main execute dispatcher for the Airtable workflow block.
 * Validates the resource/operation pair and delegates to resource handlers.
 */

import { VALID_OPERATIONS } from './resources/constants'
import { executeRecord } from './resources/record/record-execute.server'
import { executeBase } from './resources/base/base-execute.server'

export default async function airtableExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'record':
      return executeRecord(operation, input)
    case 'base':
      return executeBase(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
