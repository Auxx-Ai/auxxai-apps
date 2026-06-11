// src/tools/find-google-contact.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  contactsApiRequest,
  resolvePersonFields,
} from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'
import { mapContactForTool } from './shared/map-contact'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface FindGoogleContactInput {
  email?: string
  phone?: string
}

interface FoundContact extends ReturnType<typeof mapContactForTool> {
  auxxRecordId: string | null
}

interface FindGoogleContactOutput {
  found: boolean
  contact: FoundContact | null
  notImportedReason?: 'NOT_IMPORTED'
}

function invalidInput(message: string): never {
  const err = new Error(message) as Error & { code: string }
  err.code = 'INVALID_INPUT'
  throw err
}

export default async function findGoogleContact(
  input: FindGoogleContactInput,
  ctx: ToolExecuteContext
): Promise<FindGoogleContactOutput> {
  // XOR re-check — converter strips .refine() from the JSON Schema.
  if (Number(!!input.email) + Number(!!input.phone) !== 1) {
    invalidInput('Provide exactly one of email or phone.')
  }

  const token = getContactsAccessToken()
  const query = (input.email ?? input.phone)!

  // Warm up Google's searchContacts index (required on cold caches).
  await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
    query: '',
    readMask: 'names',
  })

  const result = await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
    query,
    readMask: resolvePersonFields('*'),
    pageSize: 10,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidates = (result.results ?? []).map((r: any) => r.person).filter(Boolean)
  const match = input.email
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidates.find((p: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p.emailAddresses ?? []).some(
          (e: { value?: string }) => e.value?.toLowerCase() === input.email!.toLowerCase()
        )
      )
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidates.find((p: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p.phoneNumbers ?? []).some(
          (ph: { value?: string; canonicalForm?: string }) =>
            ph.value === input.phone || ph.canonicalForm === input.phone
        )
      )

  if (!match) return { found: false, contact: null }

  const mapped = mapContactForTool(match)
  const auxxRecordId = await resolveContactRef(mapped.resourceName)

  return {
    found: true,
    contact: { ...mapped, auxxRecordId },
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}
