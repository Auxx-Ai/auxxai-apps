// src/blocks/supabase/supabase.server.ts

/**
 * Main execute dispatcher for the Supabase workflow block.
 * Validates the resource/operation pair and delegates to resource handlers.
 */

import { VALID_OPERATIONS } from './resources/constants'
import { executeRow } from './resources/row/row-execute.server'

export default async function supabaseExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'row':
      return executeRow(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
