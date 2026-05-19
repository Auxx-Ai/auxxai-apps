// src/tools/send-whatsapp-contacts.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { sanitizePhone } from './shared/sanitize-phone'

interface SendWhatsappContactsInput {
  phoneNumberId: string
  recipientPhone: string
  formattedName: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

interface SendWhatsappContactsOutput {
  messageId: string
  recipientWaId: string
}

interface SendResponse {
  messages?: { id: string }[]
  contacts?: { wa_id: string }[]
}

export default async function sendWhatsappContacts(
  input: SendWhatsappContactsInput
): Promise<SendWhatsappContactsOutput> {
  const { token } = getWhatsappConnection()
  const to = sanitizePhone(input.recipientPhone)

  const contact: Record<string, unknown> = {
    name: {
      formatted_name: input.formattedName,
      ...(input.firstName ? { first_name: input.firstName } : {}),
      ...(input.lastName ? { last_name: input.lastName } : {}),
    },
  }
  if (input.phone) contact.phones = [{ phone: input.phone, type: 'CELL' }]
  if (input.email) contact.emails = [{ email: input.email, type: 'WORK' }]

  const result = await whatsappApi<SendResponse>(`${input.phoneNumberId}/messages`, token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts: [contact],
    },
  })

  return {
    messageId: result.messages?.[0]?.id ?? '',
    recipientWaId: result.contacts?.[0]?.wa_id ?? '',
  }
}
