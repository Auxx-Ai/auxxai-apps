// src/blocks/airtable/shared/list-bases.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { airtableApi, throwConnectionNotFound } from './airtable-api'

export default async function listBases(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const bases: { label: string; value: string }[] = []
  let offset: string | undefined

  do {
    const qs: Record<string, string> = {}
    if (offset) qs.offset = offset

    const response = await airtableApi('GET', '/meta/bases', token, { qs })

    for (const base of response.bases ?? []) {
      bases.push({
        label: base.name,
        value: base.id,
      })
    }

    offset = response.offset
  } while (offset)

  return bases.sort((a, b) => a.label.localeCompare(b.label))
}
