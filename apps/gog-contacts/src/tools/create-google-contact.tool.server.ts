// src/tools/create-google-contact.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { contactsApiRequest } from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface CreateGoogleContactInput {
  name: {
    givenName?: string
    familyName?: string
    middleName?: string
    honorificPrefix?: string
    honorificSuffix?: string
  }
  emails?: { value: string; type?: string }[]
  phones?: { value: string; type?: string }[]
  company?: string
  jobTitle?: string
  notes?: string
  birthday?: string
  addresses?: {
    type?: string
    streetAddress?: string
    city?: string
    region?: string
    postalCode?: string
    countryCode?: string
  }[]
  groupResourceNames?: string[]
}

interface CreateGoogleContactOutput {
  auxxRecordId: string | null
  resourceName: string
  contactId: string
  displayName: string | null
  etag: string
  notImportedReason?: 'NOT_IMPORTED'
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

export default async function createGoogleContact(
  input: CreateGoogleContactInput,
  ctx: ToolExecuteContext
): Promise<CreateGoogleContactOutput> {
  if (!input.name.givenName && !input.name.familyName && !input.name.middleName) {
    invalidInput('name.givenName, name.familyName, or name.middleName is required.')
  }

  const token = getContactsAccessToken()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    names: [
      {
        ...(input.name.givenName ? { givenName: input.name.givenName } : {}),
        ...(input.name.familyName ? { familyName: input.name.familyName } : {}),
        ...(input.name.middleName ? { middleName: input.name.middleName } : {}),
        ...(input.name.honorificPrefix ? { honorificPrefix: input.name.honorificPrefix } : {}),
        ...(input.name.honorificSuffix ? { honorificSuffix: input.name.honorificSuffix } : {}),
      },
    ],
  }

  if (input.emails?.length) {
    body.emailAddresses = input.emails.map((e) => ({
      value: e.value,
      type: e.type ?? 'home',
    }))
  }
  if (input.phones?.length) {
    body.phoneNumbers = input.phones.map((p) => ({
      value: p.value,
      type: p.type ?? 'mobile',
    }))
  }
  if (input.company || input.jobTitle) {
    body.organizations = [
      {
        ...(input.company ? { name: input.company } : {}),
        ...(input.jobTitle ? { title: input.jobTitle } : {}),
      },
    ]
  }
  if (input.notes) {
    body.biographies = [{ value: input.notes, contentType: 'TEXT_PLAIN' }]
  }
  if (input.birthday) {
    body.birthdays = [{ date: parseBirthday(input.birthday) }]
  }
  if (input.addresses?.length) {
    body.addresses = input.addresses.map((a) => ({
      ...(a.type ? { type: a.type } : {}),
      ...(a.streetAddress ? { streetAddress: a.streetAddress } : {}),
      ...(a.city ? { city: a.city } : {}),
      ...(a.region ? { region: a.region } : {}),
      ...(a.postalCode ? { postalCode: a.postalCode } : {}),
      ...(a.countryCode ? { countryCode: a.countryCode } : {}),
    }))
  }
  if (input.groupResourceNames?.length) {
    body.memberships = input.groupResourceNames.map((rn) => ({
      contactGroupMembership: { contactGroupResourceName: rn },
    }))
  }

  const result = await contactsApiRequest(token, 'POST', '/people:createContact', body)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = result as any

  const resourceName: string = created.resourceName ?? ''
  const displayName: string | null =
    created.names?.[0]?.displayName ??
    `${created.names?.[0]?.givenName ?? ''} ${created.names?.[0]?.familyName ?? ''}`.trim() ??
    null

  const auxxRecordId = await resolveContactRef(resourceName)

  return {
    auxxRecordId,
    resourceName,
    contactId: shortId(resourceName),
    displayName: displayName || null,
    etag: created.etag ?? '',
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}
