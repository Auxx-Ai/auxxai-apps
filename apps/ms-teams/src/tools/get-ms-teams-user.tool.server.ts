// src/tools/get-ms-teams-user.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsUser, mapUser } from './shared/map-user'

interface GetMsTeamsUserInput {
  userId: string
}

export default async function getMsTeamsUser(
  input: GetMsTeamsUserInput,
  ctx: ToolExecuteContext
): Promise<MappedMsTeamsUser> {
  const { token } = getMsTeamsConnection()
  const raw = await graphApi<unknown>('GET', `/users/${input.userId}`, token)
  return mapUser(raw, ctx)
}
