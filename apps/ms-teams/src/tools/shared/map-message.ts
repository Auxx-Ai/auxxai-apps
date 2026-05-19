// src/tools/shared/map-message.ts

/**
 * Tool-surface mappers for Microsoft Teams messages
 * (both channelMessage on `/beta` and chatMessage on `/v1.0`).
 */

export type MsTeamsContentType = 'text' | 'html'

export interface MappedMsTeamsChannelMessage {
  id: string
  fromUserId: string | null
  fromDisplayName: string | null
  content: string
  contentType: MsTeamsContentType
  createdAt: string
  replyCount: number
  webUrl: string | null
}

export interface MappedMsTeamsChatMessage {
  id: string
  fromUserId: string | null
  fromDisplayName: string | null
  content: string
  contentType: MsTeamsContentType
  createdAt: string
}

export interface MappedMsTeamsReplyMessage {
  id: string
  fromUserId: string | null
  fromDisplayName: string | null
  content: string
  contentType: MsTeamsContentType
  createdAt: string
}

function normalizeContentType(value: unknown): MsTeamsContentType {
  return value === 'html' ? 'html' : 'text'
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
function readFromUser(m: any): { userId: string | null; displayName: string | null } {
  const user = m?.from?.user
  if (!user) return { userId: null, displayName: null }
  return {
    userId: user.id ? String(user.id) : null,
    displayName: user.displayName ? String(user.displayName) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
function readBody(m: any): { content: string; contentType: MsTeamsContentType } {
  return {
    content: String(m?.body?.content ?? ''),
    contentType: normalizeContentType(m?.body?.contentType),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChannelMessage(m: any): MappedMsTeamsChannelMessage {
  const { userId, displayName } = readFromUser(m)
  const { content, contentType } = readBody(m)
  return {
    id: String(m?.id ?? ''),
    fromUserId: userId,
    fromDisplayName: displayName,
    content,
    contentType,
    createdAt: String(m?.createdDateTime ?? ''),
    replyCount: Array.isArray(m?.replies) ? m.replies.length : 0,
    webUrl: m?.webUrl ? String(m.webUrl) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChatMessage(m: any): MappedMsTeamsChatMessage {
  const { userId, displayName } = readFromUser(m)
  const { content, contentType } = readBody(m)
  return {
    id: String(m?.id ?? ''),
    fromUserId: userId,
    fromDisplayName: displayName,
    content,
    contentType,
    createdAt: String(m?.createdDateTime ?? ''),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapReplyMessage(m: any): MappedMsTeamsReplyMessage {
  const { userId, displayName } = readFromUser(m)
  const { content, contentType } = readBody(m)
  return {
    id: String(m?.id ?? ''),
    fromUserId: userId,
    fromDisplayName: displayName,
    content,
    contentType,
    createdAt: String(m?.createdDateTime ?? ''),
  }
}
