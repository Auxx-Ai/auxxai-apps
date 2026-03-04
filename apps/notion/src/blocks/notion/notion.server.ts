// src/blocks/notion/notion.server.ts

/**
 * Main execute dispatcher for the Notion workflow block.
 * Validates the resource/operation pair and delegates to resource handlers.
 */

import { VALID_OPERATIONS } from './resources/constants'
import { executeDatabasePage } from './resources/database-page/database-page-execute.server'
import { executePage } from './resources/page/page-execute.server'
import { executeBlock } from './resources/block/block-execute.server'
import { executeDatabase } from './resources/database/database-execute.server'
import { executeUser } from './resources/user/user-execute.server'

export default async function notionExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'databasePage':
      return executeDatabasePage(operation, input)
    case 'page':
      return executePage(operation, input)
    case 'block':
      return executeBlock(operation, input)
    case 'database':
      return executeDatabase(operation, input)
    case 'user':
      return executeUser(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
