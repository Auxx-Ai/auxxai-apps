// src/tools/send-whatsapp-location.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { sanitizePhone } from './shared/sanitize-phone'

interface SendWhatsappLocationInput {
  phoneNumberId: string
  recipientPhone: string
  longitude: string
  latitude: string
  name?: string
  address?: string
}

interface SendWhatsappLocationOutput {
  messageId: string
  recipientWaId: string
}

interface SendResponse {
  messages?: { id: string }[]
  contacts?: { wa_id: string }[]
}

export default async function sendWhatsappLocation(
  input: SendWhatsappLocationInput
): Promise<SendWhatsappLocationOutput> {
  const { token } = getWhatsappConnection()
  const to = sanitizePhone(input.recipientPhone)

  const result = await whatsappApi<SendResponse>(`${input.phoneNumberId}/messages`, token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location: {
        longitude: parseFloat(input.longitude),
        latitude: parseFloat(input.latitude),
        ...(input.name ? { name: input.name } : {}),
        ...(input.address ? { address: input.address } : {}),
      },
    },
  })

  return {
    messageId: result.messages?.[0]?.id ?? '',
    recipientWaId: result.contacts?.[0]?.wa_id ?? '',
  }
}
