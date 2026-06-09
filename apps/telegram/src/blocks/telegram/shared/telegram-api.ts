import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

export const TELEGRAM_API = 'https://api.telegram.org'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your inputs (chat ID, message ID, etc.).',
  401: 'Invalid bot token. Please reconnect your Telegram bot in Settings \u2192 Apps \u2192 Telegram.',
  403: 'Bot was blocked by the user, or does not have permission to send messages to this chat.',
  404: 'Chat or message not found. Verify the chat ID and message ID.',
  409: 'Conflict \u2014 another bot instance may be running with the same token.',
  429: 'Rate limit exceeded. Please try again later.',
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean
  result: T
  description?: string
  error_code?: number
  parameters?: {
    retry_after?: number
    migrate_to_chat_id?: number
  }
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Telegram bot not connected. Please add your Bot Token in Settings \u2192 Apps \u2192 Telegram.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function telegramApi<T = unknown>(
  method: string,
  botToken: string,
  params?: Record<string, unknown>
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(params && { body: JSON.stringify(params) }),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'Telegram request failed')
  }

  const data = (await response.json()) as TelegramApiResponse<T>

  if (!data.ok) {
    const statusCode = data.error_code ?? response.status
    const message =
      ERROR_MESSAGES[statusCode] ?? `Telegram API error: ${data.description ?? response.statusText}`

    if (statusCode === 401) throw new ConnectionExpiredError('organization')
    if (statusCode === 403) throw new InsufficientPermissionsError('organization')
    if (statusCode === 429) {
      const ra = data.parameters?.retry_after
      throw new RateLimitError(typeof ra === 'number' ? ra : undefined)
    }
    if (statusCode === 404) throw new NotFoundError(message)
    if (statusCode === 409) throw new ConflictError(message)
    if (statusCode >= 500) {
      throw new UpstreamServiceError(`Telegram error ${statusCode}`, statusCode)
    }
    if (statusCode === 400 || statusCode === 422) {
      throw new InvalidInputError(message)
    }
    throw new Error(message)
  }

  return data.result
}

export function getFileDownloadUrl(botToken: string, filePath: string): string {
  return `${TELEGRAM_API}/file/bot${botToken}/${filePath}`
}
