// src/tools/send-whatsapp-media.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { sanitizePhone } from './shared/sanitize-phone'

interface SendWhatsappMediaInput {
  phoneNumberId: string
  recipientPhone: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}

interface SendWhatsappMediaOutput {
  messageId: string
  recipientWaId: string
}

interface SendResponse {
  messages?: { id: string }[]
  contacts?: { wa_id: string }[]
}

export default async function sendWhatsappMedia(
  input: SendWhatsappMediaInput
): Promise<SendWhatsappMediaOutput> {
  const { token } = getWhatsappConnection()
  const to = sanitizePhone(input.recipientPhone)
  const mediaType = input.mediaType ?? 'image'

  const mediaPayload: Record<string, unknown> = { link: input.mediaUrl }
  if (input.caption) mediaPayload.caption = input.caption
  if (mediaType === 'document' && input.filename) mediaPayload.filename = input.filename

  const result = await whatsappApi<SendResponse>(`${input.phoneNumberId}/messages`, token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: mediaType,
      [mediaType]: mediaPayload,
    },
  })

  return {
    messageId: result.messages?.[0]?.id ?? '',
    recipientWaId: result.contacts?.[0]?.wa_id ?? '',
  }
}
