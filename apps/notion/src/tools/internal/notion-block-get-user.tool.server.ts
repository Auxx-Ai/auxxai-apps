// src/tools/internal/notion-block-get-user.tool.server.ts

import { executeUser } from '../../blocks/notion/resources/user/user-execute.server'

export default async function notionBlockGetUser(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeUser('get', input)
}
