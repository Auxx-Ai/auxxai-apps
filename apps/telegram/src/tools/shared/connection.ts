// src/tools/shared/connection.ts

import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/telegram/shared/telegram-api'

export function getTelegramBotToken(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
