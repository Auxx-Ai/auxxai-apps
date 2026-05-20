// src/tools/telegram-block-get-file.tool.server.ts

import { executeFile } from '../blocks/telegram/resources/file/file-execute.server'

export default async function telegramBlockGetFile(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFile('get', input)
}
