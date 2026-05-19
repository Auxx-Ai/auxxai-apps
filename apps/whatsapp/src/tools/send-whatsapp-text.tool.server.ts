// src/tools/send-whatsapp-text.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { normalizePhone } from './shared/normalize-phone'
import { resolveContactRefByPhone } from './shared/resolve-contact-ref'
import { sanitizePhone } from './shared/sanitize-phone'

interface SendWhatsappTextInput {
  phoneNumberId: string
  recipientPhone: string
  body: string
  previewUrl?: boolean
}

interface SendWhatsappTextOutput {
  messageId: string
  recipientWaId: string
  normalizedPhone: string
  auxxRecordId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

interface SendResponse {
  messages?: { id: string }[]
  contacts?: { wa_id: string }[]
}

export default async function sendWhatsappText(
  input: SendWhatsappTextInput,
  ctx: ToolExecuteContext
): Promise<SendWhatsappTextOutput> {
  const { token } = getWhatsappConnection()
  const to = sanitizePhone(input.recipientPhone)

  const result = await whatsappApi<SendResponse>(`${input.phoneNumberId}/messages`, token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: input.body,
        preview_url: input.previewUrl ?? false,
      },
    },
  })

  const normalized = normalizePhone(input.recipientPhone)
  const recordId = await resolveContactRefByPhone(ctx, normalized)

  return {
    messageId: result.messages?.[0]?.id ?? '',
    recipientWaId: result.contacts?.[0]?.wa_id ?? '',
    normalizedPhone: normalized,
    auxxRecordId: recordId,
    notImportedReason: recordId ? null : 'NOT_IMPORTED',
  }
}
