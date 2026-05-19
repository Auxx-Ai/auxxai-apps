// src/tools/get-slack-user.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackUser, mapUser } from './shared/map-user'

interface GetSlackUserInput {
  userId: string
}

export default async function getSlackUser(
  input: GetSlackUserInput,
  ctx: ToolExecuteContext
): Promise<MappedSlackUser> {
  const { token } = getSlackConnection()
  const info = await slackApi('users.info', token, { user: input.userId })
  if (!info.user) {
    const err = new Error(`User not found: ${input.userId}`) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }
  return mapUser(info.user, ctx)
}
