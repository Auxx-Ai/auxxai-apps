// src/tools/gog-contacts-block-get-many-contacts.tool.server.ts

import { executeContact } from '../blocks/google-contacts/resources/contact/contact-execute.server'

export default async function gogContactsBlockGetManyContacts(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeContact('getMany', input)
}
