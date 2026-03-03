// src/blocks/notion/resources/user/user-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { notionApi, notionPaginatedRequest, throwConnectionNotFound } from '../../shared/notion-api'

export async function executeUser(
  operation: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'get':
      return getUser(token, input)
    case 'getMany':
      return getManyUsers(token, input)
    default:
      throw new Error(`Unknown user operation: ${operation}`)
  }
}

async function getUser(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const userId = input.getUserId?.trim()
  if (!userId) {
    throw new BlockValidationError([{ field: 'getUserId', message: 'User ID is required.' }])
  }

  const result = await notionApi('GET', `/users/${userId}`, token)

  return {
    userId: result.id ?? '',
    name: result.name ?? '',
    email: result.person?.email ?? '',
    type: result.type ?? '',
    avatarUrl: result.avatar_url ?? '',
  }
}

async function getManyUsers(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const returnAll =
    input.getManyUserReturnAll === true || input.getManyUserReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.getManyUserLimit) || 100

  const { results } = await notionPaginatedRequest('GET', '/users', token, {
    returnAll,
    limit,
  })

  const users = results.map((user: any) => ({
    id: user.id,
    name: user.name ?? '',
    email: user.person?.email ?? '',
    type: user.type ?? '',
    avatarUrl: user.avatar_url ?? '',
  }))

  return {
    users: JSON.stringify(users),
    totalCount: String(users.length),
  }
}
