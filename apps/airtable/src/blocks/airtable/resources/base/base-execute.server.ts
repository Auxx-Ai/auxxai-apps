// src/blocks/airtable/resources/base/base-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../shared/airtable-api'

export async function executeBase(
  operation: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'getMany':
      return getManyBases(token, input)
    case 'getSchema':
      return getBaseSchema(token, input)
    default:
      throw new Error(`Unknown base operation: ${operation}`)
  }
}

async function getManyBases(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const returnAll = input.getManyReturnAll === true || input.getManyReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.getManyLimit) || 100

  const bases: any[] = []
  let offset: string | undefined
  let pages = 0

  do {
    if (pages > 0) await new Promise((r) => setTimeout(r, 250))

    const qs: Record<string, string> = {}
    if (offset) qs.offset = offset

    const response = await airtableApi('GET', '/meta/bases', token, { qs })

    for (const base of response.bases ?? []) {
      bases.push({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel,
      })
    }

    offset = response.offset
    pages++

    if (pages >= 50) break
    if (!returnAll && bases.length >= (limit ?? 100)) break
  } while (offset)

  const limited = returnAll ? bases : bases.slice(0, limit ?? 100)

  return {
    bases: JSON.stringify(limited),
    totalCount: String(limited.length),
  }
}

async function getBaseSchema(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const baseId = input.getSchemaBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'getSchemaBase', message: 'Select a base.' }])
  }

  const response = await airtableApi('GET', `/meta/bases/${baseId}/tables`, token)

  const tables = (response.tables ?? []).map((table: any) => ({
    id: table.id,
    name: table.name,
    fields: table.fields ?? [],
    views: table.views ?? [],
  }))

  return {
    tables: JSON.stringify(tables),
    tableCount: String(tables.length),
  }
}
