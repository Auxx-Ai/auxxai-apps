// src/tools/telegram-block-get-file.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeFile } from '../blocks/telegram/resources/file/file-execute.server'
import { getFileInputs, getFileOutputs } from './schemas/file'

type Input = z.infer<typeof getFileInputs>
type Output = z.infer<typeof getFileOutputs>

export default async function telegramBlockGetFile(input: Input): Promise<Output> {
  return executeFile('get', input) as Promise<Output>
}
