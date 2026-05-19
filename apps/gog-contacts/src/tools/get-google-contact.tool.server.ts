// src/tools/get-google-contact.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import {
  contactsApiRequest,
  resolvePersonFields,
} from '../blocks/google-contacts/shared/google-contacts-api'
import { getContactsAccessToken } from './shared/connection'
import { mapContactForToolFull, type FullMappedContact } from './shared/map-contact'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface GetGoogleContactInput {
  resourceName: string
}

type GetGoogleContactOutput = FullMappedContact & {
  auxxRecordId: string | null
  notImportedReason?: 'NOT_IMPORTED'
}

export default async function getGoogleContact(
  input: GetGoogleContactInput,
  ctx: ToolExecuteContext
): Promise<GetGoogleContactOutput> {
  const token = getContactsAccessToken()

  const person = await contactsApiRequest(token, 'GET', `/${input.resourceName}`, undefined, {
    personFields: resolvePersonFields('*'),
  })

  const mapped = mapContactForToolFull(person)
  const auxxRecordId = await resolveContactRef(ctx, mapped.resourceName)

  return {
    ...mapped,
    auxxRecordId,
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}
