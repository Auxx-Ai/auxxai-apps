// src/tools/shared/map-chat.ts

export type ChatType = 'private' | 'group' | 'supergroup' | 'channel'

export interface MappedChat {
  chatId: string
  type: ChatType
  title: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  description: string | null
  memberCount: number | null
}

function chatType(raw: unknown): ChatType {
  if (raw === 'private' || raw === 'group' || raw === 'supergroup' || raw === 'channel') {
    return raw
  }
  return 'private'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapChat(raw: any, memberCount: number | null = null): MappedChat {
  return {
    chatId: raw?.id != null ? String(raw.id) : '',
    type: chatType(raw?.type),
    title: raw?.title ?? null,
    username: raw?.username ?? null,
    firstName: raw?.first_name ?? null,
    lastName: raw?.last_name ?? null,
    description: raw?.description ?? null,
    memberCount,
  }
}
