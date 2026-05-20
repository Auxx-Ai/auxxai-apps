// src/tools/gog-contacts-block-get-contact.tool.server.ts

import { executeContact } from '../blocks/google-contacts/resources/contact/contact-execute.server'

export default async function gogContactsBlockGetContact(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeContact('get', input)
}
