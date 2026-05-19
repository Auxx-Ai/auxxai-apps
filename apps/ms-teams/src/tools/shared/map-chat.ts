// src/tools/shared/map-chat.ts

/**
 * Tool-surface mappers for Microsoft Teams chats (1:1 + group + meeting).
 * Source: `GET /me/chats` or `GET /chats/{id}`.
 */

export type MsTeamsChatType = 'oneOnOne' | 'group' | 'meeting'

export interface MappedMsTeamsChatSummary {
  id: string
  topic: string | null
  chatType: MsTeamsChatType
  lastUpdatedAt: string | null
}

export interface MappedMsTeamsChatMember {
  userId: string | null
  displayName: string | null
  email: string | null
}

export interface MappedMsTeamsChat {
  id: string
  topic: string | null
  chatType: MsTeamsChatType
  members: MappedMsTeamsChatMember[]
}

function normalizeChatType(value: unknown): MsTeamsChatType {
  if (value === 'oneOnOne') return 'oneOnOne'
  if (value === 'meeting') return 'meeting'
  return 'group'
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChatSummary(c: any): MappedMsTeamsChatSummary {
  return {
    id: String(c?.id ?? ''),
    topic: c?.topic ? String(c.topic) : null,
    chatType: normalizeChatType(c?.chatType),
    lastUpdatedAt: c?.lastUpdatedDateTime ? String(c.lastUpdatedDateTime) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChatMember(m: any): MappedMsTeamsChatMember {
  return {
    userId: m?.userId ? String(m.userId) : null,
    displayName: m?.displayName ? String(m.displayName) : null,
    email: m?.email ? String(m.email) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChat(c: any): MappedMsTeamsChat {
  const rawMembers = Array.isArray(c?.members) ? c.members : []
  return {
    id: String(c?.id ?? ''),
    topic: c?.topic ? String(c.topic) : null,
    chatType: normalizeChatType(c?.chatType),
    members: rawMembers.map(mapChatMember),
  }
}
