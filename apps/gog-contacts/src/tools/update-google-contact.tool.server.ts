// src/tools/update-google-contact.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { contactsApiRequest } from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface NamePatch {
  givenName?: string
  familyName?: string
  middleName?: string
  honorificPrefix?: string
  honorificSuffix?: string
}

interface UpdateGoogleContactInput {
  resourceName: string
  etag?: string
  patch: {
    name?: NamePatch
    addEmails?: { value: string; type?: string }[]
    removeEmails?: string[]
    addPhones?: { value: string; type?: string }[]
    removePhones?: string[]
    company?: string | null
    jobTitle?: string | null
    notes?: string | null
    birthday?: string | null
    addGroupResourceNames?: string[]
    removeGroupResourceNames?: string[]
  }
}

interface UpdateGoogleContactOutput {
  auxxRecordId: string | null
  resourceName: string
  contactId: string
  displayName: string | null
  etag: string
}

function invalidInput(message: string): never {
  const err = new Error(message) as Error & { code: string }
  err.code = 'INVALID_INPUT'
  throw err
}

function parseBirthday(s: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!match) invalidInput(`birthday must be YYYY-MM-DD, got "${s}".`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function shortId(resourceName: string): string {
  const slash = resourceName.indexOf('/')
  return slash >= 0 ? resourceName.slice(slash + 1) : resourceName
}

export default async function updateGoogleContact(
  input: UpdateGoogleContactInput,
  ctx: ToolExecuteContext
): Promise<UpdateGoogleContactOutput> {
  const token = getContactsAccessToken()
  const { resourceName, patch } = input

  // Determine which field groups we're touching to compose the read-mask.
  const touchesEmails = Boolean(patch.addEmails?.length || patch.removeEmails?.length)
  const touchesPhones = Boolean(patch.addPhones?.length || patch.removePhones?.length)
  const touchesGroups = Boolean(
    patch.addGroupResourceNames?.length || patch.removeGroupResourceNames?.length
  )
  const touchesName = Boolean(patch.name)
  const touchesOrg = patch.company !== undefined || patch.jobTitle !== undefined
  const touchesNotes = patch.notes !== undefined
  const touchesBirthday = patch.birthday !== undefined

  const needsCurrent = !input.etag || touchesName || touchesEmails || touchesPhones || touchesGroups

  // Pre-fetch only the groups we need to merge or to capture etag.
  const readFields = [
    'metadata',
    touchesName ? 'names' : '',
    touchesEmails ? 'emailAddresses' : '',
    touchesPhones ? 'phoneNumbers' : '',
    touchesGroups ? 'memberships' : '',
  ]
    .filter(Boolean)
    .join(',')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = null
  if (needsCurrent) {
    current = await contactsApiRequest(token, 'GET', `/${resourceName}`, undefined, {
      personFields: readFields || 'metadata',
    })
  }

  const etag = input.etag ?? current?.etag ?? ''
  if (!etag) invalidInput('Could not determine etag for update — provide etag explicitly.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = { etag }
  const updatePersonFields: string[] = []

  if (touchesName) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (current?.names?.[0] ?? {}) as any
    body.names = [
      {
        ...existing,
        ...(patch.name!.givenName !== undefined ? { givenName: patch.name!.givenName } : {}),
        ...(patch.name!.familyName !== undefined ? { familyName: patch.name!.familyName } : {}),
        ...(patch.name!.middleName !== undefined ? { middleName: patch.name!.middleName } : {}),
        ...(patch.name!.honorificPrefix !== undefined
          ? { honorificPrefix: patch.name!.honorificPrefix }
          : {}),
        ...(patch.name!.honorificSuffix !== undefined
          ? { honorificSuffix: patch.name!.honorificSuffix }
          : {}),
      },
    ]
    updatePersonFields.push('names')
  }

  if (touchesEmails) {
    const removals = new Set((patch.removeEmails ?? []).map((e) => e.toLowerCase()))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kept = ((current?.emailAddresses ?? []) as any[]).filter(
      (e) => !removals.has(String(e.value ?? '').toLowerCase())
    )
    const added = (patch.addEmails ?? []).map((e) => ({
      value: e.value,
      type: e.type ?? 'home',
    }))
    body.emailAddresses = [...kept, ...added]
    updatePersonFields.push('emailAddresses')
  }

  if (touchesPhones) {
    const removals = new Set(patch.removePhones ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kept = ((current?.phoneNumbers ?? []) as any[]).filter(
      (p) => !removals.has(String(p.value ?? '')) && !removals.has(String(p.canonicalForm ?? ''))
    )
    const added = (patch.addPhones ?? []).map((p) => ({
      value: p.value,
      type: p.type ?? 'mobile',
    }))
    body.phoneNumbers = [...kept, ...added]
    updatePersonFields.push('phoneNumbers')
  }

  if (touchesOrg) {
    if (patch.company === null && patch.jobTitle === null) {
      body.organizations = []
    } else {
      body.organizations = [
        {
          ...(patch.company !== undefined && patch.company !== null ? { name: patch.company } : {}),
          ...(patch.jobTitle !== undefined && patch.jobTitle !== null
            ? { title: patch.jobTitle }
            : {}),
        },
      ]
    }
    updatePersonFields.push('organizations')
  }

  if (touchesNotes) {
    body.biographies =
      patch.notes === null ? [] : [{ value: patch.notes, contentType: 'TEXT_PLAIN' }]
    updatePersonFields.push('biographies')
  }

  if (touchesBirthday) {
    const bday = patch.birthday
    body.birthdays = bday == null ? [] : [{ date: parseBirthday(bday) }]
    updatePersonFields.push('birthdays')
  }

  if (touchesGroups) {
    const removals = new Set(patch.removeGroupResourceNames ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kept = ((current?.memberships ?? []) as any[]).filter((m) => {
      const rn = m.contactGroupMembership?.contactGroupResourceName
      return rn && !removals.has(rn)
    })
    const additions = (patch.addGroupResourceNames ?? []).map((rn) => ({
      contactGroupMembership: { contactGroupResourceName: rn },
    }))
    body.memberships = [...kept, ...additions]
    updatePersonFields.push('memberships')
  }

  if (updatePersonFields.length === 0) {
    invalidInput('patch must include at least one field to update.')
  }

  const result = await contactsApiRequest(token, 'PATCH', `/${resourceName}:updateContact`, body, {
    updatePersonFields: updatePersonFields.join(','),
    personFields: 'names,metadata',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = result as any
  const newResourceName: string = updated.resourceName ?? resourceName
  const displayName: string | null =
    updated.names?.[0]?.displayName ??
    `${updated.names?.[0]?.givenName ?? ''} ${updated.names?.[0]?.familyName ?? ''}`.trim() ??
    null

  const auxxRecordId = await resolveContactRef(newResourceName)

  return {
    auxxRecordId,
    resourceName: newResourceName,
    contactId: shortId(newResourceName),
    displayName: displayName || null,
    etag: updated.etag ?? '',
  }
}
