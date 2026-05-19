// src/tools/internal/notion-block-get-many-users.tool.server.ts

import { executeUser } from '../../blocks/notion/resources/user/user-execute.server'

export default async function notionBlockGetManyUsers(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeUser('getMany', input)
}
