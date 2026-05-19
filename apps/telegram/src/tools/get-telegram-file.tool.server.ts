// src/tools/get-telegram-file.tool.server.ts

import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedFile, mapFile } from './shared/map-file'

interface GetTelegramFileInput {
  fileId: string
}

export default async function getTelegramFile(input: GetTelegramFileInput): Promise<MappedFile> {
  const token = getTelegramBotToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any>('getFile', token, { file_id: input.fileId })
  return mapFile(raw, token)
}
