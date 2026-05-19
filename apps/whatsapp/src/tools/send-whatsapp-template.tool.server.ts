// src/tools/send-whatsapp-template.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { sanitizePhone } from './shared/sanitize-phone'

interface SendWhatsappTemplateInput {
  phoneNumberId: string
  recipientPhone: string
  templateId: string
  components?: string
}

interface SendWhatsappTemplateOutput {
  messageId: string
  messageStatus: string
  recipientWaId: string
}

interface SendResponse {
  messages?: { id: string }[]
  contacts?: { wa_id: string }[]
}

export default async function sendWhatsappTemplate(
  input: SendWhatsappTemplateInput
): Promise<SendWhatsappTemplateOutput> {
  const { token } = getWhatsappConnection()
  const to = sanitizePhone(input.recipientPhone)

  const [name, language] = (input.templateId ?? '').split('|')

  let components: unknown[] = []
  if (input.components) {
    try {
      components = JSON.parse(input.components)
    } catch {
      throw new Error('Invalid template components JSON')
    }
  }

  const result = await whatsappApi<SendResponse>(`${input.phoneNumberId}/messages`, token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: language },
        ...(components.length > 0 ? { components } : {}),
      },
    },
  })

  return {
    messageId: result.messages?.[0]?.id ?? '',
    messageStatus: 'sent',
    recipientWaId: result.contacts?.[0]?.wa_id ?? '',
  }
}
