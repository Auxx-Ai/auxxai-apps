// src/tools/gog-contacts-block-create-contact.tool.server.ts

import { executeContact } from '../blocks/google-contacts/resources/contact/contact-execute.server'

export default async function gogContactsBlockCreateContact(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeContact('create', input)
}
