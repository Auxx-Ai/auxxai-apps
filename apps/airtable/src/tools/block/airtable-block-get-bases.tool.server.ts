// src/tools/block/airtable-block-get-bases.tool.server.ts

/**
 * Internal block-op tool: lift of the `executeBase('getMany', …)` branch
 * from the previous airtable block server. Preserves the legacy block
 * input/output shape verbatim so the dispatcher cutover is behaviour-neutral.
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'

interface Input {
  returnAll?: boolean
  limit?: number
}

interface Output {
  bases: Array<{ id: string; name: string; permissionLevel: string }>
  totalCount: string
}

export default async function airtableBlockGetBases(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const returnAll = input.returnAll === true
  const limit = returnAll ? undefined : Number(input.limit) || 100

  const bases: Array<{ id: string; name: string; permissionLevel: string }> = []
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
    bases: limited,
    totalCount: String(limited.length),
  }
}
