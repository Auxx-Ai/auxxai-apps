// src/tools/gog-contacts-block-update-contact.tool.server.ts

import { executeContact } from '../blocks/google-contacts/resources/contact/contact-execute.server'

export default async function gogContactsBlockUpdateContact(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeContact('update', input)
}
