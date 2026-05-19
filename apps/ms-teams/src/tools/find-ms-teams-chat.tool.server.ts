// src/tools/find-ms-teams-chat.tool.server.ts

import { graphPaginatedGet } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChat, mapChat } from './shared/map-chat'

interface FindMsTeamsChatInput {
  query: string
}

interface FindMsTeamsChatOutput {
  chat: MappedMsTeamsChat | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function findMsTeamsChat(
  input: FindMsTeamsChatInput
): Promise<FindMsTeamsChatOutput> {
  const { token } = getMsTeamsConnection()
  const query = input.query.trim()
  if (!query) return { chat: null }

  const isEmail = EMAIL_RE.test(query)
  const needle = query.toLowerCase()

  // `$expand=members` joins membership inline — one request per page.
  const { items } = await graphPaginatedGet<unknown>('/me/chats?$expand=members', token, {
    returnAll: true,
  })

  const chats = items.map(mapChat)

  // Topic match first (group + meeting chats).
  for (const chat of chats) {
    if (chat.topic && chat.topic.toLowerCase() === needle) {
      return { chat }
    }
  }

  // Participant email / display name match (covers 1:1 chats with no topic).
  for (const chat of chats) {
    for (const member of chat.members) {
      if (isEmail && member.email && member.email.toLowerCase() === needle) {
        return { chat }
      }
      if (!isEmail && member.displayName?.toLowerCase().includes(needle)) {
        return { chat }
      }
    }
  }

  // Topic substring fallback.
  for (const chat of chats) {
    if (chat.topic && chat.topic.toLowerCase().includes(needle)) {
      return { chat }
    }
  }

  return { chat: null }
}
