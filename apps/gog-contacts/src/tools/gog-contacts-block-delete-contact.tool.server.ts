// src/tools/gog-contacts-block-delete-contact.tool.server.ts

import { executeContact } from '../blocks/google-contacts/resources/contact/contact-execute.server'

export default async function gogContactsBlockDeleteContact(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeContact('delete', input)
}
