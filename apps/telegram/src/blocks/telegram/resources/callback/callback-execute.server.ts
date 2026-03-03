import { getOrganizationConnection } from '@auxx/sdk/server'
import { telegramApi, throwConnectionNotFound } from '../../shared/telegram-api'

export async function executeCallback(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const botToken = connection.value

  switch (operation) {
    case 'answerQuery': {
      const params: Record<string, unknown> = {
        callback_query_id: input.answerQueryId,
      }
      if (input.answerQueryText) params.text = input.answerQueryText
      if (input.answerQueryShowAlert) params.show_alert = true
      if (input.answerQueryUrl) params.url = input.answerQueryUrl
      if (input.answerQueryCacheTime) params.cache_time = input.answerQueryCacheTime

      await telegramApi('answerCallbackQuery', botToken, params)
      return { success: 'true' }
    }

    case 'answerInlineQuery': {
      let results: unknown
      try {
        results = JSON.parse(input.answerInlineResults)
      } catch {
        throw new Error('Results must be a valid JSON array')
      }

      const params: Record<string, unknown> = {
        inline_query_id: input.answerInlineQueryId,
        results,
      }
      if (input.answerInlineCacheTime) params.cache_time = input.answerInlineCacheTime

      await telegramApi('answerInlineQuery', botToken, params)
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown callback operation: ${operation}`)
  }
}
