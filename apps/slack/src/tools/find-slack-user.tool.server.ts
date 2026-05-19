// src/tools/find-slack-user.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackUser, mapUser } from './shared/map-user'

interface FindSlackUserInput {
  query: string
}

interface FindSlackUserOutput {
  user: MappedSlackUser | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function findSlackUser(
  input: FindSlackUserInput,
  ctx: ToolExecuteContext
): Promise<FindSlackUserOutput> {
  const { token } = getSlackConnection()
  const query = input.query.trim()
  if (!query) return { user: null }

  // Email path — exact lookup.
  if (EMAIL_RE.test(query)) {
    try {
      const lookup = await slackApi('users.lookupByEmail', token, { email: query })
      const u = lookup.user as unknown
      if (!u) return { user: null }
      const info = await slackApi('users.info', token, {
        user: (u as { id: string }).id,
      })
      const member = (info.user ?? u) as unknown
      return { user: await mapUser(member, ctx) }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        message.toLowerCase().includes('users_not_found') ||
        message.toLowerCase().includes('no user found')
      ) {
        return { user: null }
      }
      throw error
    }
  }

  // Name path — paginated users.list filter, case-insensitive substring.
  const needle = query.toLowerCase()
  let cursor: string | undefined

  do {
    const response = await slackApi('users.list', token, {
      limit: 200,
      ...(cursor ? { cursor } : {}),
    })

    for (const u of response.members ?? []) {
      if (u.deleted || u.is_bot || u.id === 'USLACKBOT') continue
      const display = (u.profile?.display_name || u.real_name || u.name || '').toLowerCase()
      if (display.includes(needle)) {
        return { user: await mapUser(u, ctx) }
      }
    }

    cursor = response.response_metadata?.next_cursor || undefined
  } while (cursor)

  return { user: null }
}
