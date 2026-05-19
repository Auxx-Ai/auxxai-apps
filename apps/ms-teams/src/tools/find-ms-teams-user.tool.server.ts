// src/tools/find-ms-teams-user.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsUser, mapUser } from './shared/map-user'

interface FindMsTeamsUserInput {
  query: string
}

interface FindMsTeamsUserOutput {
  user: MappedMsTeamsUser | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface GraphUserList {
  value?: unknown[]
}

export default async function findMsTeamsUser(
  input: FindMsTeamsUserInput,
  ctx: ToolExecuteContext
): Promise<FindMsTeamsUserOutput> {
  const { token } = getMsTeamsConnection()
  const query = input.query.trim()
  if (!query) return { user: null }

  if (EMAIL_RE.test(query)) {
    const escaped = query.replace(/'/g, "''")
    const filter = encodeURIComponent(`mail eq '${escaped}' or userPrincipalName eq '${escaped}'`)
    const response = await graphApi<GraphUserList>('GET', `/users?$filter=${filter}&$top=1`, token)
    const first = response.value?.[0]
    if (!first) return { user: null }
    return { user: await mapUser(first, ctx) }
  }

  // Name path — $search needs `ConsistencyLevel: eventual`.
  const search = encodeURIComponent(`"displayName:${query}"`)
  const response = await graphApi<GraphUserList>(
    'GET',
    `/users?$search=${search}&$top=10&$orderby=displayName`,
    token,
    { headers: { ConsistencyLevel: 'eventual' } }
  )

  const first = response.value?.[0]
  if (!first) return { user: null }
  return { user: await mapUser(first, ctx) }
}
