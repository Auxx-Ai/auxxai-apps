// src/tools/list-airtable-bases.tool.server.ts

import { airtableApi } from '../blocks/airtable/shared/airtable-api'
import { getAirtableToken } from './shared/connection'
import { mapBase, type MappedAirtableBase } from './shared/map-base'

interface ListAirtableBasesOutput {
  bases: MappedAirtableBase[]
}

export default async function listAirtableBases(): Promise<ListAirtableBasesOutput> {
  const token = getAirtableToken()

  const bases: MappedAirtableBase[] = []
  let offset: string | undefined

  do {
    const qs: Record<string, string> = {}
    if (offset) qs.offset = offset

    const response = await airtableApi('GET', '/meta/bases', token, { qs })
    for (const base of response.bases ?? []) {
      bases.push(mapBase(base))
    }
    offset = response.offset
  } while (offset)

  return { bases }
}
