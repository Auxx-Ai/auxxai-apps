// src/tools/list-google-contact-groups.tool.server.ts

import { contactsApiRequestAll } from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'

interface ContactGroupRow {
  resourceName: string
  name: string
  groupType: 'USER_CONTACT_GROUP' | 'SYSTEM_CONTACT_GROUP'
  memberCount: number | null
}

interface ListGoogleContactGroupsOutput {
  groups: ContactGroupRow[]
}

export default async function listGoogleContactGroups(): Promise<ListGoogleContactGroupsOutput> {
  const token = getContactsAccessToken()

  const items = await contactsApiRequestAll(
    token,
    'GET',
    '/contactGroups',
    undefined,
    undefined,
    'contactGroups'
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: ContactGroupRow[] = items.map((g: any) => ({
    resourceName: g.resourceName ?? '',
    name: g.name ?? g.formattedName ?? g.resourceName ?? '',
    groupType:
      g.groupType === 'SYSTEM_CONTACT_GROUP' ? 'SYSTEM_CONTACT_GROUP' : 'USER_CONTACT_GROUP',
    memberCount: typeof g.memberCount === 'number' ? g.memberCount : null,
  }))

  return { groups }
}
