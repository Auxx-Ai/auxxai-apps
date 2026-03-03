import { getOrganizationConnection } from '@auxx/sdk/server'
import { telegramApi, throwConnectionNotFound } from '../../shared/telegram-api'

export async function executeChat(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const botToken = connection.value

  switch (operation) {
    case 'get': {
      const result = await telegramApi<any>('getChat', botToken, {
        chat_id: input.getChatChatId,
      })
      return {
        chatId: String(result.id),
        type: result.type ?? '',
        title: result.title ?? '',
        username: result.username ?? '',
        firstName: result.first_name ?? '',
        lastName: result.last_name ?? '',
        description: result.description ?? '',
        memberCount: String(result.member_count ?? ''),
      }
    }

    case 'getAdministrators': {
      const result = await telegramApi<any[]>('getChatAdministrators', botToken, {
        chat_id: input.getAdminsChatId,
      })
      return {
        administrators: result,
        count: String(result.length),
      }
    }

    case 'getMember': {
      const result = await telegramApi<any>('getChatMember', botToken, {
        chat_id: input.getMemberChatId,
        user_id: input.getMemberUserId,
      })
      return {
        status: result.status ?? '',
        userId: String(result.user?.id ?? ''),
        firstName: result.user?.first_name ?? '',
        lastName: result.user?.last_name ?? '',
        username: result.user?.username ?? '',
        isBot: String(result.user?.is_bot ?? false),
      }
    }

    case 'leave': {
      await telegramApi('leaveChat', botToken, {
        chat_id: input.leaveChatId,
      })
      return { success: 'true' }
    }

    case 'setDescription': {
      await telegramApi('setChatDescription', botToken, {
        chat_id: input.setDescChatId,
        description: input.setDescDescription ?? '',
      })
      return { success: 'true' }
    }

    case 'setTitle': {
      await telegramApi('setChatTitle', botToken, {
        chat_id: input.setTitleChatId,
        title: input.setTitleTitle,
      })
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown chat operation: ${operation}`)
  }
}
