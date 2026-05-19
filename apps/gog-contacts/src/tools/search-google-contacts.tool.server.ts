// src/tools/search-google-contacts.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  contactsApiRequest,
  resolvePersonFields,
} from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'
import { mapContactForTool } from './shared/map-contact'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface SearchGoogleContactsInput {
  query: string
  limit?: number
}

interface SearchedContact {
  auxxRecordId: string | null
  resourceName: string
  contactId: string
  displayName: string | null
  emails: { value: string; type: string | null }[]
  phones: { value: string; type: string | null }[]
  company: string | null
  jobTitle: string | null
}

interface SearchGoogleContactsOutput {
  contacts: SearchedContact[]
  truncated: boolean
}

const HARD_MAX = 50

export default async function searchGoogleContacts(
  input: SearchGoogleContactsInput,
  ctx: ToolExecuteContext
): Promise<SearchGoogleContactsOutput> {
  const token = getContactsAccessToken()
  const limit = Math.min(Math.max(input.limit ?? 10, 1), HARD_MAX)

  // Index warmup — required on cold caches per Google People API docs.
  await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
    query: '',
    readMask: 'names',
  })

  const result = await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
    query: input.query,
    readMask: resolvePersonFields('*'),
    // Fetch one extra to detect truncation.
    pageSize: limit + 1,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (result.results ?? []).map((r: any) => r.person).filter(Boolean)
  const truncated = raw.length > limit
  const trimmed = raw.slice(0, limit)

  const contacts = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trimmed.map(async (person: any) => {
      const m = mapContactForTool(person)
      const auxxRecordId = await resolveContactRef(ctx, m.resourceName)
      return {
        auxxRecordId,
        resourceName: m.resourceName,
        contactId: m.contactId,
        displayName: m.displayName,
        emails: m.emails,
        phones: m.phones,
        company: m.company,
        jobTitle: m.jobTitle,
      }
    })
  )

  return { contacts, truncated }
}
